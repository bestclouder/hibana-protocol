import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

/**
 * POST /api/stripe/webhooks — verifies the Stripe signature server-side
 * before any DB write (docs/SECURITY.md), then logs the payment event to
 * audit_logs. Refunds/disputes are deliberately NOT automated: they are
 * logged and left for a human.
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhooks] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err) {
    console.error("[stripe/webhooks] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await writeAudit(supabase, {
          action: "payment.checkout_completed",
          target_type: "stripe_checkout_session",
          actor_email: session.customer_details?.email ?? null,
          metadata: {
            session_id: session.id,
            amount_total: session.amount_total,
            currency: session.currency,
            plan: "aoai_pilot",
          },
        });
        break;
      }
      case "charge.refunded":
      case "charge.dispute.created": {
        // Stop and get a human (docs/SECURITY.md): log only, never automate
        await writeAudit(supabase, {
          action: `payment.${event.type.replace(/\./g, "_")}_NEEDS_HUMAN`,
          target_type: "stripe_event",
          metadata: { event_id: event.id, event_type: event.type },
        });
        break;
      }
      default: {
        await writeAudit(supabase, {
          action: "payment.event_received",
          target_type: "stripe_event",
          metadata: { event_id: event.id, event_type: event.type },
        });
      }
    }
  } catch (err) {
    console.error(`[stripe/webhooks] error handling ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}
