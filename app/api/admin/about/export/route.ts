import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { buildAboutFile } from "@/lib/about";

// Everything in "О нас" (all languages, unpublished too) as a JSON file that the
// import understands: a backup, or a template for adding Kazakh/Korean texts.
export async function GET() {
  try {
    await requireHrOrAdmin();
    const rows = await prisma.aboutSection.findMany();
    return new Response(JSON.stringify(buildAboutFile(rows), null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="about-us.json"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
