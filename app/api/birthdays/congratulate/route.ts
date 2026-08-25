import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { birthdayGreetingSchema } from "@/lib/validations/birthday";
import { notifyUser } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = birthdayGreetingSchema.parse(body);

    const fromLabel = data.anonymous ? "Аноним" : session.user.name ?? "Коллега";
    const message = data.message
      ? `${fromLabel} поздравляет вас с днём рождения: «${data.message}»`
      : `${fromLabel} поздравляет вас с днём рождения! 🎉`;

    const recipient = await prisma.user.findFirst({
      where: { employeeId: data.toEmployeeId },
      select: { id: true, email: true },
    });

    if (recipient) {
      if (recipient.id === session.user.id) {
        throw new ApiError(400, "Нельзя поздравить самого себя");
      }
      await notifyUser({
        userId: recipient.id,
        email: recipient.email,
        type: "BIRTHDAY_GREETING",
        title: "С днём рождения!",
        message,
      });
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // The birthday person hasn't logged into the portal yet, so there's no
    // User row to attach an in-app notification to - fall back to emailing
    // their org-directory address directly instead of blocking the send.
    const employee = await prisma.employee.findUnique({
      where: { id: data.toEmployeeId },
      select: { email: true },
    });
    if (!employee) {
      throw new ApiError(404, "Сотрудник не найден");
    }
    try {
      await sendEmail({ to: employee.email, subject: "С днём рождения!", html: `<p>${message}</p>` });
    } catch (error) {
      console.error("Failed to send birthday greeting email:", error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
