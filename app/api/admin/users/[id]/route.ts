import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const updateUserSchema = z
  .object({
    role: z.enum(["ADMIN", "HR", "EMPLOYEE"]).optional(),
    canBookRooms: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.canBookRooms !== undefined, {
    message: "Не указано ни одно поле для изменения",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { role, canBookRooms } = updateUserSchema.parse(body);

    if (role !== undefined && params.id === session.user.id && role !== "ADMIN") {
      throw new ApiError(400, "Нельзя снять роль администратора с самого себя");
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role, canBookRooms },
      select: { id: true, displayName: true, email: true, role: true, canBookRooms: true },
    });

    if (role !== undefined) {
      await logAudit({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        summary: `Изменена роль пользователя «${user.displayName}» на ${role}`,
      });
    }
    if (canBookRooms !== undefined) {
      await logAudit({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        summary: `${canBookRooms ? "Выдано" : "Отозвано"} право бронирования переговорных пользователю «${user.displayName}»`,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
