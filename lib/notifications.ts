import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export type NotificationType = "BOOKING_CREATED" | "BOOKING_UPDATED" | "BOOKING_CANCELLED" | "NEWS_PINNED";

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

/**
 * Broadcasts a pinned (important) news post to every portal user - both an
 * in-app notification and a best-effort email (see notifyUser above).
 * excludeUserId skips the admin who pinned it, matching how booking
 * notifications skip the acting user.
 */
export async function notifyPinnedNews(news: { title: string }, excludeUserId: string) {
  const users = await prisma.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { id: true, email: true },
  });

  const link = "/";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;">
      <p style="color:#111827;">Опубликована важная новость на портале:</p>
      <p style="font-size:16px; font-weight:bold; color:#111827;">${news.title}</p>
      <p style="margin-top:16px;">
        <a href="${(process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")}${link}" style="color:#d80010;">Открыть портал →</a>
      </p>
    </div>
  `;

  await Promise.all(
    users.map((u) =>
      notifyUser({
        userId: u.id,
        email: u.email,
        type: "NEWS_PINNED",
        title: "Важная новость",
        message: news.title,
        link,
        emailHtml: html,
      })
    )
  );
}
