"use client";

import { useState } from "react";
import type { UpcomingBirthday } from "@/lib/birthdays";
import type { Dictionary, Locale } from "@/lib/i18n";
import { BirthdaysCarousel } from "@/components/home/birthdays-carousel";
import { NewHiresCarousel, type NewHire } from "@/components/home/new-hires-carousel";

type Tab = "birthdays" | "hires";

/**
 * Birthdays and new colleagues in one card with two tabs (it replaces the
 * "Поздравляем!" tiles plus two separate carousel cards, which listed the same
 * people three times). The counts sit on the tabs.
 */
export function PeopleWidget({
  birthdays,
  hires,
  locale,
  dict,
  employeeModalDict,
  common,
}: {
  birthdays: UpcomingBirthday[];
  hires: NewHire[];
  locale: Locale;
  dict: Dictionary["home"];
  employeeModalDict: Dictionary["orgStructure"]["employeeModal"];
  common: Dictionary["common"];
}) {
  // Open on the tab that has something to show.
  const [tab, setTab] = useState<Tab>(birthdays.length > 0 || hires.length === 0 ? "birthdays" : "hires");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "birthdays", label: dict.congrats.birthdays, count: birthdays.length },
    { id: "hires", label: dict.congrats.newHires, count: hires.length },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-medium text-gray-900">{dict.congrats.title}</h3>

      {/* flex-auto, not equal columns: "Новые сотрудники" is longer than "Дни рождения" and would be cut off */}
      <div className="mb-3 flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
        {tabs.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTab(t.id)}
              className={`flex min-w-0 flex-auto items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                selected ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="truncate">{t.label}</span>
              <span
                className={`min-w-[18px] shrink-0 rounded-full px-1.5 text-[11px] leading-[18px] tabular-nums transition-colors ${
                  selected ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Both tabs show a 64px photo row and a footer, so the card does not jump when switching. */}
      <div
        role="group"
        aria-label={tab === "birthdays" ? dict.birthdays.title : dict.newHires.title}
        className="min-h-[7.5rem]"
      >
        {tab === "birthdays" ? (
          <BirthdaysCarousel
            birthdays={birthdays}
            locale={locale}
            dict={dict.birthdays}
            employeeModalDict={employeeModalDict}
            common={common}
          />
        ) : (
          <NewHiresCarousel
            employees={hires}
            locale={locale}
            dict={dict.newHires}
            employeeModalDict={employeeModalDict}
            common={common}
          />
        )}
      </div>
    </div>
  );
}
