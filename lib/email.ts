import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn("[email] SMTP_USER or SMTP_PASS not set — skipping:", subject);
    return;
  }
  if (!to || to.trim() === "") {
    console.warn("[email] No recipient address — set ADMIN_NOTIFY_EMAIL in .env. Skipping:", subject);
    return;
  }

  console.log(`[email] Sending "${subject}" → ${to}`);
  const transporter = getTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"BittsQuiz" <${smtpUser}>`,
      to,
      subject,
      html,
    });
    console.log("[email] Sent OK:", info.messageId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] Send failed:", message);
    throw err; // re-throw so callers can handle
  }
}

/** Verify SMTP connection and credentials — use for the admin test endpoint */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL ?? smtpUser ?? "";

  if (!smtpUser || !smtpPass) {
    return { ok: false, error: "SMTP_USER or SMTP_PASS not set in .env" };
  }
  if (!adminTo) {
    return { ok: false, error: "ADMIN_NOTIFY_EMAIL not set in .env" };
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const ADMIN_EMAIL = (): string =>
  process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_USER ?? "";
