import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export type NotificationType = "BOOKING_CREATED" | "BOOKING_UPDATED" | "BOOKING_CANCELLED";

/**
 * Creates the in-app notification (always) and best-effort emails it (only
 * if SMTP_* is configured - see lib/email.ts). A failed email never breaks
 * the caller's main flow (booking create/cancel/edit).
 */
/** Prepends NEXTAUTH_URL so links work in an email client - a relative
 * path like "/bookings/mine" has no base to resolve against there. */
function absoluteLink(link: string): string {
  const base = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  return `${base}${link}`;
}

export async function notifyUser(params: {
  userId: string;
  email: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  /** Overrides the auto-generated <p>{message}</p> email body with a richer template. */
  emailHtml?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });

  const html =
    params.emailHtml ??
    `<p>${params.message}</p>${params.link ? `<p><a href="${absoluteLink(params.link)}">${absoluteLink(params.link)}</a></p>` : ""}`;

  try {
    await sendEmail({ to: params.email, subject: params.title, html });
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}
