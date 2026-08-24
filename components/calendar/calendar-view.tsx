"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import type { Holiday, Vacation, Employee } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatMonthYear, getWeekdayShortNames } from "@/lib/i18n/format";
import { useToast } from "@/components/ui/toast-provider";
import { HolidayFormModal } from "@/components/calendar/holiday-form-modal";
import { VacationFormModal } from "@/components/calendar/vacation-form-modal";

type VacationWithEmployee = Vacation & { employee: Pick<Employee, "id" | "fullName" | "photoUrl"> };

function isSameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinRange(day: Date, start: Date, end: Date) {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d >= s && d <= e;
}

function monthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarView({
  year,
  month,
  holidays,
  vacations,
  canManage,
  locale,
  dict,
  common,
}: {
  year: number;
  month: number;
  holidays: Holiday[];
  vacations: VacationWithEmployee[];
  canManage: boolean;
  locale: Locale;
  dict: Dictionary["calendar"];
  common: Dictionary["common"];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [modal, setModal] = useState<"holiday" | "vacation" | null>(null);

  const today = new Date();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - leadingBlanks + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);
  const weekdayNames = getWeekdayShortNames(locale);
  const isEmpty = holidays.length === 0 && vacations.length === 0;

  async function handleDeleteHoliday(id: string) {
    const res = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast(dict.deleteFailed);
      return;
    }
    router.refresh();
  }

  async function handleDeleteVacation(id: string) {
    const res = await fetch(`/api/vacations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast(dict.deleteFailed);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${monthParam(prevMonthDate)}`}
            aria-label={dict.prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h2 className="min-w-[160px] text-center text-lg font-semibold text-gray-900">
            {formatMonthYear(year, month, locale)}
          </h2>
          <Link
            href={`/calendar?month=${monthParam(nextMonthDate)}`}
            aria-label={dict.nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModal("holiday")}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {dict.addHoliday}
            </button>
            <button
              type="button"
              onClick={() => setModal("vacation")}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {dict.addVacation}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {weekdayNames.map((name) => (
          <div key={name} className="bg-gray-50 px-2 py-1.5 text-center text-xs font-medium text-gray-500">
            {name}
          </div>
        ))}
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <div key={i} className="min-h-[96px] bg-white" />;

          const cellDate = new Date(year, month, dayNum);
          const isToday = isSameYMD(cellDate, today);
          const dayHoliday = holidays.find((h) => isSameYMD(new Date(h.date), cellDate));
          const dayVacations = vacations.filter((v) =>
            isWithinRange(cellDate, new Date(v.startDate), new Date(v.endDate))
          );

          return (
            <div key={i} className="flex min-h-[96px] flex-col gap-1 bg-white p-1.5">
              <span
                className={`self-end text-xs ${
                  isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 font-medium text-white"
                    : "text-gray-500"
                }`}
              >
                {dayNum}
              </span>
              {dayHoliday && (
                <div className="group flex items-center justify-between gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
                  <span className="truncate">{dayHoliday.title}</span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(dict.deleteHoliday)) handleDeleteHoliday(dayHoliday.id);
                      }}
                      aria-label={common.close}
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
              {dayVacations.map((v) => (
                <div
                  key={v.id}
                  className="group flex items-center justify-between gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700"
                >
                  <span className="truncate">{v.employee.fullName}</span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(dict.deleteVacation)) handleDeleteVacation(v.id);
                      }}
                      aria-label={common.close}
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isEmpty && <p className="text-sm text-gray-500">{dict.empty}</p>}

      {modal === "holiday" && (
        <HolidayFormModal dict={dict.holidayModal} common={common} onClose={() => setModal(null)} />
      )}
      {modal === "vacation" && (
        <VacationFormModal dict={dict.vacationModal} common={common} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
