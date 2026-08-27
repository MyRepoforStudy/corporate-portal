import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    if (body.status !== "OPEN" && body.status !== "RESOLVED") {
      return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
    }

    const itRequest = await prisma.itRequest.update({
      where: { id: params.id },
      data: { status: body.status },
      include: { requester: { select: { id: true, email: true } } },
    });

    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "ItRequest",
      entityId: itRequest.id,
      summary: `IT-заявка «${itRequest.subject}» переведена в статус ${itRequest.status}`,
    });

    if (itRequest.status === "RESOLVED") {
      await notifyUser({
        userId: itRequest.requester.id,
        email: itRequest.requester.email,
        type: "IT_REQUEST_RESOLVED",
        title: "Ваша IT-заявка решена",
        message: `Заявка «${itRequest.subject}» отмечена как решённая.`,
        link: "/it-services",
      });
    }

    return NextResponse.json(itRequest);
  } catch (error) {
    return handleApiError(error);
  }
}
