import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export type NotificationType = "BOOKING_CREATED" | "BOOKING_UPDATED" | "BOOKING_CANCELLED";

/**
 * Creates the in-app notification (always) and best-effort emails it (only
 * if SMTP_* is configured - see lib/email.ts). A failed email never breaks
 * the caller's main flow (booking create/cancel/edit).
 */
export async function notifyUser(params: {
  userId: string;
  email: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
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

  try {
    await sendEmail({
      to: params.email,
      subject: params.title,
      html: `<p>${params.message}</p>${params.link ? `<p><a href="${params.link}">${params.link}</a></p>` : ""}`,
    });
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}
