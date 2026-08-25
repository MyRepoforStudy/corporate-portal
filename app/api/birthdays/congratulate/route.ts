import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { birthdayGreetingSchema } from "@/lib/validations/birthday";
import { notifyUser } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = birthdayGreetingSchema.parse(body);

    const recipient = await prisma.user.findFirst({
      where: { employeeId: data.toEmployeeId },
      select: { id: true, email: true },
    });
    if (!recipient) {
      throw new ApiError(404, "У этого сотрудника нет аккаунта на портале");
    }
    if (recipient.id === session.user.id) {
      throw new ApiError(400, "Нельзя поздравить самого себя");
    }

    const fromLabel = data.anonymous ? "Аноним" : session.user.name ?? "Коллега";
    const message = data.message
      ? `${fromLabel} поздравляет вас с днём рождения: «${data.message}»`
      : `${fromLabel} поздравляет вас с днём рождения! 🎉`;

    await notifyUser({
      userId: recipient.id,
      email: recipient.email,
      type: "BIRTHDAY_GREETING",
      title: "С днём рождения!",
      message,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
