import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";
import { getLocale } from "@/lib/i18n";
import { buildPublicTree } from "@/lib/about";

// The "О нас" tab of the home page: published chapters with their sections,
// in the language of the current cookie (empty translations fall back to Russian).
export async function GET() {
  try {
    await requireSession();
    const locale = getLocale();
    const rows = await prisma.aboutSection.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ locale, chapters: buildPublicTree(rows, locale) });
  } catch (error) {
    return handleApiError(error);
  }
}
