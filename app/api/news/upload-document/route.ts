import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { saveUploadedDocument } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const result = await saveUploadedDocument(formData.get("document"));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
