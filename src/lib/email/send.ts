import nodemailer from "nodemailer";
import { getSetting, setSetting } from "@/lib/db/settings";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getEmailsSentToday(): number {
  const date = getSetting("emails_sent_date");
  if (date !== todayKey()) return 0;
  return parseInt(getSetting("emails_sent_today", "0"), 10) || 0;
}

export function canSendEmail(): { ok: boolean; reason?: string; remaining: number } {
  const cap = parseInt(getSetting("daily_email_cap", "30"), 10) || 30;
  const sent = getEmailsSentToday();
  if (sent >= cap) {
    return { ok: false, reason: `Daily email cap reached (${cap}/day)`, remaining: 0 };
  }
  return { ok: true, remaining: cap - sent };
}

function bumpSentCount() {
  const today = todayKey();
  if (getSetting("emails_sent_date") !== today) {
    setSetting("emails_sent_date", today);
    setSetting("emails_sent_today", "1");
  } else {
    setSetting("emails_sent_today", String(getEmailsSentToday() + 1));
  }
}

export async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const gate = canSendEmail();
  if (!gate.ok) return { ok: false, error: gate.reason };

  const host = getSetting("smtp_host") || process.env.SMTP_HOST;
  const port = parseInt(getSetting("smtp_port") || process.env.SMTP_PORT || "587", 10);
  const user = getSetting("smtp_user") || process.env.SMTP_USER;
  const pass = getSetting("smtp_pass") || process.env.SMTP_PASS;
  const from = getSetting("smtp_from") || process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return { ok: false, error: "SMTP is not configured. Add host/user/pass/from in Settings." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.body,
    });
    bumpSentCount();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
