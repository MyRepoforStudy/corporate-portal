import { CompassTipsAdmin } from "@/components/admin/compass-tips-admin";
import { FaqItemsAdmin } from "@/components/admin/faq-items-admin";

export default function AdminCompassPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Компас новичка</h1>
        <p className="text-sm text-gray-500">Управление содержимым страницы «Компас новичка» для новых сотрудников.</p>
      </div>
      <CompassTipsAdmin />
      <FaqItemsAdmin />
    </div>
  );
}
