/**
 * Resend email sender (docs/ARCHITECTURE.md). Server-side only — the API key
 * never reaches the client. Missing key or API failure returns an error the
 * caller records in email_notifications and shows the admin: no silent failure.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email service isn't configured yet (RESEND_API_KEY missing). Add it in Vercel env vars and try again.",
    };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "Hibana Protocol <onboarding@resend.dev>",
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend returned ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export function solutionEmailHtml(input: {
  recipientName: string;
  ticketNumber: string;
  ticketTitle: string;
  clusterTitle: string;
  solutionBody: string;
  ticketUrl: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
  <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #211b15;">
    <p style="color:#e4572e; font-size:13px; letter-spacing:0.1em; text-transform:uppercase;">✦ Hibana Protocol</p>
    <h1 style="font-size:22px; line-height:1.3;">A solution has been posted for your issue</h1>
    <p>Hi ${esc(input.recipientName)},</p>
    <p>The organiser posted a solution for <strong>${esc(input.clusterTitle)}</strong>, which covers
    your ticket <strong>[${esc(input.ticketNumber)}] ${esc(input.ticketTitle)}</strong>.</p>
    <div style="background:#fdefe9; border:1px solid #f3c9b8; border-radius:8px; padding:16px; margin:16px 0; white-space:pre-wrap;">${esc(input.solutionBody)}</div>
    <p>
      <a href="${input.ticketUrl}" style="display:inline-block; background:#e4572e; color:#fff; text-decoration:none; padding:10px 18px; border-radius:6px; font-weight:600;">
        Open your ticket
      </a>
    </p>
    <p style="font-size:13px; color:#6e655c;">Once you've tried it, mark your ticket <strong>Solved</strong> or <strong>Still stuck</strong> so the organiser knows.</p>
  </div>`;
}
