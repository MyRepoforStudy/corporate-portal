import { NextResponse, type NextRequest } from "next/server";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { saveUploadedImage } from "@/lib/upload";

// A photo for the text of "О нас" (the "Вставить фото" button of the editor and
// the photos of the JSON import). Same rules as every other image upload:
// PNG/JPEG/WEBP/GIF, up to 5 MB; the file goes to public/uploads.
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
