import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  text,
  className,
}: {
  icon: LucideIcon;
  text: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 py-8 text-center ${className ?? ""}`}>
      <Icon className="h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
