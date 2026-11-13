import { ImportAdmin } from "@/components/admin/import-admin";
import { BirthdaysImportAdmin } from "@/components/admin/birthdays-import-admin";

export default function AdminImportPage() {
  return (
    <div className="space-y-12">
      <ImportAdmin />
      <BirthdaysImportAdmin />
    </div>
  );
}
