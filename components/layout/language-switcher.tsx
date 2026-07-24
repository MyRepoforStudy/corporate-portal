"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "kk", label: "KZ" },
  { value: "ru", label: "RU" },
  { value: "ko", label: "KO" },
];

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center rounded-full border border-gray-200 p-0.5 text-xs">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSelect(option.value)}
          className={`rounded-full px-2.5 py-1 font-medium transition ${
            option.value === locale
              ? "bg-brand-600 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
