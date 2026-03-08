import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
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
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[email] SMTP not configured — skipping email:", subject);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"BittsQuiz" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_USER ?? "";
