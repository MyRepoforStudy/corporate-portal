import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

export interface CongratsTile {
  icon: LucideIcon;
  count: number;
  label: string;
}

/** `countDelay`: when (ms after page open) the numbers start counting up -
 * the page reveals its blocks one after another, so a lower tile starts later. */
export function CongratsWidget({
  title,
  tiles,
  countDelay = 0,
}: {
  title: string;
  tiles: CongratsTile[];
  countDelay?: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-medium text-gray-900">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col items-center gap-1 rounded-md bg-gray-50 p-3 text-center">
            <tile.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <p className="text-lg font-semibold text-gray-900">
              <CountUp value={tile.count} delay={countDelay} />
            </p>
            <p className="text-xs text-gray-500">{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
