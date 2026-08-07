import "server-only";
import nodemailer from "nodemailer";

/** SMTP is optional — password reset degrades gracefully without it (see auth actions). */
export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendMail(to: string, subject: string, text: string) {
  if (!isMailConfigured()) {
    console.warn(`SMTP not configured — skipped sending "${subject}" to ${to}`);
    return;
  }
  const transport = createTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    text,
  });
}
