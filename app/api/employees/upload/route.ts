import { NextResponse, type NextRequest } from "next/server";
import { requireSession, handleApiError } from "@/lib/rbac";
import { saveUploadedImage } from "@/lib/upload";

// Open to any authenticated user - shared by the admin employee form (admin
// attaches the returned URL via PUT /api/employees/[id], HR-or-Admin only)
// and the self-service profile form (attaches it via PATCH /api/profile,
// which only ever touches the caller's own linked Employee record). This
// endpoint only turns a file into a URL; it never writes to an employee
// record itself, so there's nothing here for a plain employee to escalate.
export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const formData = await request.formData();
    const url = await saveUploadedImage(formData.get("image"));
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
