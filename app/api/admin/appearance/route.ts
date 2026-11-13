import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { appearanceInputSchema, describeAppearance } from "@/lib/appearance";
import { saveAppearance } from "@/lib/appearance-db";

// Admin -> Оформление: which layers (glow, mountains, snow) are shown behind the pages of the portal.
// Only the administrator: it changes the look for every employee.
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const input = appearanceInputSchema.parse(await request.json().catch(() => null));
    const appearance = await saveAppearance(input);
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "SiteSetting",
      entityId: "appearance",
      summary: `Оформление портала — ${describeAppearance(appearance)}`,
    });
    return NextResponse.json(appearance);
  } catch (error) {
    return handleApiError(error);
  }
}
