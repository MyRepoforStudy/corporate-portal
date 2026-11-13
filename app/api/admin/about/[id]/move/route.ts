import { NextResponse, type NextRequest } from "next/server";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { aboutMoveSchema } from "@/lib/validations/about";
import { moveAboutRow } from "@/lib/about-db";

// Moves a chapter/section one place up or down among its siblings.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireHrOrAdmin();
    const { direction } = aboutMoveSchema.parse(await request.json());
    await moveAboutRow(params.id, direction);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
