import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { aboutFileSchema } from "@/lib/validations/about";
import { planAboutImport } from "@/lib/about";
import { saveAboutImport } from "@/lib/about-db";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "Файл не найден в запросе");
    }

    let json: unknown;
    try {
      json = JSON.parse((await file.text()).replace(/^﻿/, ""));
    } catch {
      throw new ApiError(400, "Файл не является корректным JSON");
    }

    const parsed = aboutFileSchema.safeParse(json);
    if (!parsed.success) {
      const problems = parsed.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".") || "файл"}: ${issue.message}`)
        .join("; ");
      throw new ApiError(400, `Файл не подходит: ${problems}`);
    }

    const existing = await prisma.aboutSection.findMany();
    const outcome = await saveAboutImport(planAboutImport(existing, parsed.data));

    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "AboutSection",
      summary:
        `Импорт «О нас» из JSON: создано ${outcome.created}, обновлено ${outcome.updated}, ` +
        `без изменений ${outcome.unchanged}, ошибок ${outcome.errors.length}`,
    });

    return NextResponse.json(outcome);
  } catch (error) {
    return handleApiError(error);
  }
}
