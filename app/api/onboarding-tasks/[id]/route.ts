import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { onboardingTaskSchema } from "@/lib/validations/onboarding-task";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = onboardingTaskSchema.parse(body);
    const task = await prisma.onboardingTask.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "OnboardingTask",
      entityId: task.id,
      summary: `Изменена задача онбординга «${task.title}»`,
    });
    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const task = await prisma.onboardingTask.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "OnboardingTask",
      entityId: task.id,
      summary: `Удалена задача онбординга «${task.title}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
