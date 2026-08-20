import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === "465",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

/**
 * No-op until SMTP_HOST is set in the environment - lets the rest of the
 * app call this unconditionally instead of checking config everywhere.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const client = getTransporter();
  if (!client) {
    console.debug(`[email] SMTP not configured, skipping email to ${params.to}: ${params.subject}`);
    return;
  }

  await client.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
