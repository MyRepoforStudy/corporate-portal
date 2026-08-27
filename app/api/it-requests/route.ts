import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";
import { itRequestSchema } from "@/lib/validations/it-request";
import { logAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await requireSession();
    const requests = await prisma.itRequest.findMany({
      where: { requesterId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = itRequestSchema.parse(body);

    const itRequest = await prisma.itRequest.create({
      data: { ...data, requesterId: session.user.id },
    });

    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "ItRequest",
      entityId: itRequest.id,
      summary: `Создана IT-заявка «${itRequest.subject}»`,
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    await Promise.all(
      admins.map((admin) =>
        notifyUser({
          userId: admin.id,
          email: admin.email,
          type: "IT_REQUEST_SUBMITTED",
          title: "Новая IT-заявка",
          message: itRequest.subject,
          link: "/admin/it-requests",
        })
      )
    );

    if (session.user.email) {
      await notifyUser({
        userId: session.user.id,
        email: session.user.email,
        type: "IT_REQUEST_SUBMITTED",
        title: "Заявка отправлена в IT",
        message: `Ваша заявка «${itRequest.subject}» принята в работу.`,
        link: "/it-services",
      });
    }

    return NextResponse.json(itRequest, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
