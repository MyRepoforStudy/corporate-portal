import { NextResponse, type NextRequest } from "next/server";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { saveUploadedImage } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    await requireHrOrAdmin();
    const formData = await request.formData();
    const url = await saveUploadedImage(formData.get("image"));
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
