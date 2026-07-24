import type { Department } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

export function WorkplaceFilters({
  departments,
  floors,
  buildings,
  floor,
  building,
  departmentId,
  onChange,
  onReset,
  dict,
}: {
  departments: Department[];
  floors: number[];
  buildings: string[];
  floor: string;
  building: string;
  departmentId: string;
  onChange: (patch: { floor?: string; building?: string; departmentId?: string }) => void;
  onReset: () => void;
  dict: Dictionary["workplaces"]["filters"];
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-gray-500">{dict.floor}</label>
        <select
          value={floor}
          onChange={(e) => onChange({ floor: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">{dict.allFloors}</option>
          {floors.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">{dict.building}</label>
        <select
          value={building}
          onChange={(e) => onChange({ building: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">{dict.allBuildings}</option>
          {buildings.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">{dict.department}</label>
        <select
          value={departmentId}
          onChange={(e) => onChange({ departmentId: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">{dict.allDepartments}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
      >
        {dict.reset}
      </button>
    </div>
  );
}
