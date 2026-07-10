import { NextResponse } from "next/server";
import { stripe, stripeAccountOptions, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

/**
 * POST /api/stripe/checkout — approved tool create_stripe_checkout_session
 * (docs/AGENTIC_LAYER.md). Creates a Checkout Session for the Pilot
 * Plan. Secret key stays server-side; every call writes an audit row.
 * v1 is demo-first (no login), so no auth requirement yet.
 */
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          "Payments aren't configured yet (STRIPE_SECRET_KEY missing). Add it in Vercel env vars to enable checkout.",
      },
      { status: 503 },
    );
  }

  try {
    const origin =
      request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

    const priceId = process.env.STRIPE_PRICE_ID;
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          priceId
            ? { price: priceId, quantity: 1 }
            : {
                price_data: {
                  currency: "usd",
                  unit_amount: 49900,
                  product_data: {
                    name: "Hibana Protocol — Pilot Plan",
                    description:
                      "Full pilot access: struggle tickets, common-pain clustering, solution notifications, analytics.",
                  },
                },
                quantity: 1,
              },
        ],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
        ...(PLATFORM_FEE_PERCENT > 0
          ? {
              payment_intent_data: {
                application_fee_amount: Math.round(49900 * (PLATFORM_FEE_PERCENT / 100)),
              },
            }
          : {}),
      },
      stripeAccountOptions(),
    );

    const supabase = await createClient();
    await writeAudit(supabase, {
      action: "payment.checkout_session_created",
      target_type: "stripe_checkout_session",
      metadata: { session_id: session.id, plan: "pilot" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
