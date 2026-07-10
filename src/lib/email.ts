/**
 * Transactional email via Resend's REST API (no SDK dependency).
 *
 * Graceful no-op when RESEND_API_KEY is absent: the send is skipped and
 * logged, never thrown — email must not break checkout or fulfillment.
 * Callers treat the boolean as best-effort.
 *
 * Env:
 *   RESEND_API_KEY — enables sending
 *   EMAIL_FROM     — verified sender, e.g. "Frito <orders@frito.ai>"
 */

const FROM = process.env.EMAIL_FROM || "Frito <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[email] skipped (no RESEND_API_KEY): "${subject}" → ${to}`);
    return false;
  }
  if (!to || !to.includes("@")) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}):`, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send error:", err);
    return false;
  }
}
