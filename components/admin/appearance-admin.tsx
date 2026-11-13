"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PortalBackground } from "@/components/layout/portal-background";
import { useToast } from "@/components/ui/toast-provider";
import type { Appearance } from "@/lib/appearance";

const OPTIONS: { key: keyof Appearance; title: string; text: string }[] = [
  {
    key: "glow",
    title: "Мягкое свечение",
    text: "Тёплые размытые пятна фирменных цветов медленно плывут за карточками.",
  },
  {
    key: "mountains",
    title: "Горы Алматы",
    text: "Силуэт гор с заснеженными вершинами внизу страницы; слои чуть смещаются друг относительно друга.",
  },
  {
    key: "snow",
    title: "Снег",
    text: "Падающий снег поверх страницы: для зимы и Нового года. На очень слабых компьютерах лучше выключить.",
  },
];

function Switch({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
        on ? "bg-brand-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-[#ffffff] shadow transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/** Admin -> Оформление: the layers behind the pages of the portal, with a live preview. */
export function AppearanceAdmin({ initial }: { initial: Appearance }) {
  const router = useRouter();
  const showToast = useToast();
  const [saved, setSaved] = useState<Appearance>(initial);
  const [value, setValue] = useState<Appearance>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isChanged = OPTIONS.some((option) => value[option.key] !== saved[option.key]);

  async function save() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          res.status >= 500
            ? "Не удалось сохранить: ошибка на сервере. Если портал только что обновили, проверьте, что выполнена миграция базы (таблица SiteSetting)."
            : (data?.error ?? "Не удалось сохранить")
        );
        return;
      }
      setSaved(data as Appearance);
      setValue(data as Appearance);
      showToast("Оформление сохранено. Остальные сотрудники увидят его после обновления страницы.", "success");
      router.refresh(); // the background of this very page follows at once
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Оформление</h1>
        <p className="text-sm text-gray-500">
          Фон страниц портала для всех сотрудников. Слои можно включать по отдельности и сочетать. Сотрудники увидят
          изменение после обновления страницы.
        </p>
      </div>

      <div className="relative isolate h-56 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <PortalBackground appearance={value} contained />
        <div className="relative z-[1] grid grid-cols-[1.4fr_1fr] items-start gap-3 p-4">
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <div className="h-2.5 w-2/5 rounded bg-gray-300" />
            <div className="h-2 rounded bg-gray-200" />
            <div className="h-2 w-5/6 rounded bg-gray-200" />
            <div className="h-2 w-3/5 rounded bg-gray-200" />
          </div>
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <div className="h-2.5 w-1/2 rounded bg-gray-300" />
            <div className="h-2 rounded bg-gray-200" />
            <div className="h-2 w-2/3 rounded bg-gray-200" />
          </div>
        </div>
      </div>

      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {OPTIONS.map((option) => (
          <li key={option.key} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{option.title}</p>
              <p className="text-xs text-gray-500">{option.text}</p>
            </div>
            <Switch
              on={value[option.key]}
              label={option.title}
              onChange={(next) => setValue((current) => ({ ...current, [option.key]: next }))}
            />
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-500">
        Если у сотрудника в системе включено «уменьшение движения», снег не показывается, а свечение и горы стоят на
        месте.
      </p>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={isSaving || !isChanged}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSaving ? "Сохранение..." : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(saved);
            setError(null);
          }}
          disabled={isSaving || !isChanged}
          className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Отменить изменения
        </button>
      </div>
    </div>
  );
}
