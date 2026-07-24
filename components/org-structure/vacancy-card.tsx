import { Briefcase } from "lucide-react";
import type { VacancyWithPosition } from "@/lib/org-tree";

export function VacancyCard({ vacancy, label }: { vacancy: VacancyWithPosition; label: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-400">
        <Briefcase className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-gray-700">{vacancy.position.title}</p>
        <p className="text-gray-500">{label}</p>
        {vacancy.note && <p className="mt-1 text-xs text-gray-500">{vacancy.note}</p>}
      </div>
    </div>
  );
}
