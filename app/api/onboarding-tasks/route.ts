import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { onboardingTaskSchema } from "@/lib/validations/onboarding-task";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const tasks = await prisma.onboardingTask.findMany({
      orderBy: [{ stageId: "asc" }, { order: "asc" }],
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = onboardingTaskSchema.parse(body);
    const task = await prisma.onboardingTask.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "OnboardingTask",
      entityId: task.id,
      summary: `Добавлена задача онбординга «${task.title}»`,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
