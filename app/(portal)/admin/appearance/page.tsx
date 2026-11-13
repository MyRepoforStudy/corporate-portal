import { AppearanceAdmin } from "@/components/admin/appearance-admin";
import { getAppearance } from "@/lib/appearance-db";

export const dynamic = "force-dynamic";

export default async function AdminAppearancePage() {
  return <AppearanceAdmin initial={await getAppearance()} />;
}
