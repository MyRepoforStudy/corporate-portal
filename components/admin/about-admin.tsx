"use client";

import { useRef, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Download, Eye, EyeOff, Plus, Upload } from "lucide-react";
import type { AboutSection } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";
import { useModalClose } from "@/lib/hooks/use-modal-close";
import { filledLanguages } from "@/lib/about";
import { ABOUT_BODY_MAX } from "@/lib/validations/about";
import { RichText } from "@/components/about/rich-text";

type Lang = "ru" | "kk" | "ko";

const LANGS: { id: Lang; label: string; name: string; title: "titleRu" | "titleKk" | "titleKo"; body: "bodyRu" | "bodyKk" | "bodyKo" }[] = [
  { id: "ru", label: "RU", name: "Русский", title: "titleRu", body: "bodyRu" },
  { id: "kk", label: "KK", name: "Қазақша", title: "titleKk", body: "bodyKk" },
  { id: "ko", label: "KO", name: "한국어", title: "titleKo", body: "bodyKo" },
];

interface Draft {
  id: string | null;
  isChapter: boolean;
  parentId: string | null;
  isPublished: boolean;
  titleRu: string;
  titleKk: string;
  titleKo: string;
  bodyRu: string;
  bodyKk: string;
  bodyKo: string;
}

interface ImportOutcome {
  created: number;
  updated: number;
  unchanged: number;
  errors: { where: string; message: string }[];
}

const payloadOf = (d: Draft | AboutSection) => ({
  parentId: d.parentId,
  isPublished: d.isPublished,
  titleRu: d.titleRu,
  titleKk: d.titleKk,
  titleKo: d.titleKo,
  bodyRu: d.bodyRu,
  bodyKk: d.bodyKk,
  bodyKo: d.bodyKo,
});

const inputClass = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";

export function AboutAdmin() {
  const { items, isLoading, create, update, remove, reload } = useCrudList<AboutSection>("/api/admin/about");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const chapters = items.filter((row) => row.parentId === null);
  const sectionsOf = (chapterId: string) => items.filter((row) => row.parentId === chapterId);

  function newDraft(parentId: string | null): Draft {
    return {
      id: null,
      isChapter: parentId === null,
      parentId,
      isPublished: true,
      titleRu: "",
      titleKk: "",
      titleKo: "",
      bodyRu: "",
      bodyKk: "",
      bodyKo: "",
    };
  }

  function editDraft(row: AboutSection): Draft {
    return { id: row.id, isChapter: row.parentId === null, ...payloadOf(row) };
  }

  async function run(action: Promise<string | null>) {
    setError(null);
    const message = await action;
    if (message) setError(message);
  }

  async function move(row: AboutSection, direction: "up" | "down") {
    setError(null);
    const res = await fetch(`/api/admin/about/${row.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (!res.ok) setError((await res.json().catch(() => null))?.error ?? "Не удалось переместить");
    await reload();
  }

  function handleDelete(row: AboutSection) {
    const count = row.parentId === null ? sectionsOf(row.id).length : 0;
    const question =
      row.parentId === null
        ? `Удалить главу «${row.titleRu}»${count > 0 ? ` вместе с её разделами (${count})` : ""}? Это нельзя отменить.`
        : `Удалить раздел «${row.titleRu}»?`;
    if (confirm(question)) void run(remove(row.id));
  }

  async function handleImport(file: File) {
    setError(null);
    setOutcome(null);
    setIsImporting(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/about/import", { method: "POST", body });
    setIsImporting(false);
    if (fileInput.current) fileInput.current.value = "";
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Не удалось выполнить импорт");
      return;
    }
    setOutcome(await res.json());
    await reload();
  }

  // A plain function (not a nested component), so the rows are not remounted on every render
  function renderRow(row: AboutSection, isChapter: boolean, index: number, count: number) {
    const filled = filledLanguages(row);
    return (
      <div key={row.id} className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 ${isChapter ? "bg-gray-50" : ""}`}>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm text-gray-900 ${isChapter ? "font-semibold" : "font-medium"} ${row.isPublished ? "" : "opacity-60"}`}>
            {row.titleRu}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            {LANGS.map((lang) => (
              <span
                key={lang.id}
                title={filled[lang.id] ? `${lang.name}: есть текст` : `${lang.name}: нет текста — показывается русский`}
                className={`rounded px-1.5 py-0.5 font-medium ${
                  filled[lang.id] ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-gray-100 text-gray-500"
                }`}
              >
                {lang.label}
              </span>
            ))}
            {!row.isPublished && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">скрыто</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => move(row, "up")} aria-label="Выше" className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" disabled={index === count - 1} onClick={() => move(row, "down")} aria-label="Ниже" className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => run(update(row.id, { ...payloadOf(row), isPublished: !row.isPublished }))}
            aria-label={row.isPublished ? "Скрыть" : "Опубликовать"}
            title={row.isPublished ? "Скрыть с главной" : "Показать на главной"}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            {row.isPublished ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
          </button>
          {isChapter && (
            <button type="button" onClick={() => setDraft(newDraft(row.id))} className="ml-1 text-sm text-brand-700 hover:underline dark:text-brand-300">
              + раздел
            </button>
          )}
          <button type="button" onClick={() => setDraft(editDraft(row))} className="ml-2 text-sm text-brand-700 hover:underline dark:text-brand-300">
            Изменить
          </button>
          <button type="button" onClick={() => handleDelete(row)} className="ml-2 text-sm text-red-600 hover:underline dark:text-red-400">
            Удалить
          </button>
        </div>
      </div>
    );
  }

  const sectionCount = items.length - chapters.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">О нас</h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Вкладка «О нас» на главной (Welcome Book). Главы и разделы на трёх языках: пока для казахского или корейского
            нет текста, сотрудники видят русский. Скрытое (значок глаза) на главной не показывается.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setDraft(newDraft(null))} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Глава
          </button>
          <a href="/api/admin/about/export" download className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" aria-hidden="true" />
            Экспорт JSON
          </a>
          <button type="button" disabled={isImporting} onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Upload className="h-4 w-4" aria-hidden="true" />
            {isImporting ? "Импорт..." : "Импорт JSON"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {outcome && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-900">
            Создано: <span className="font-medium">{outcome.created}</span> · Обновлено:{" "}
            <span className="font-medium">{outcome.updated}</span> · Без изменений:{" "}
            <span className="font-medium">{outcome.unchanged}</span> · Ошибок:{" "}
            <span className="font-medium">{outcome.errors.length}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Строки сопоставляются по ключам (<code>key</code>); импорт добавляет и обновляет только те языки, которые есть в файле,
            и ничего не удаляет.
          </p>
          {outcome.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-600 dark:text-red-400">
              {outcome.errors.map((e, i) => (
                <li key={i}>
                  {e.where}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : chapters.length === 0 ? (
        <p className="text-sm text-gray-500">
          Пока ничего нет. Добавьте главу вручную или загрузите готовый файл кнопкой «Импорт JSON».
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Глав: {chapters.length} · Разделов: {sectionCount}
          </p>
          {chapters.map((chapter, ci) => {
            const sections = sectionsOf(chapter.id);
            return (
              <div key={chapter.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {renderRow(chapter, true, ci, chapters.length)}
                {sections.length > 0 && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {sections.map((section, si) => renderRow(section, false, si, sections.length))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {draft && (
        <AboutEditor
          draft={draft}
          chapters={chapters}
          onClose={() => setDraft(null)}
          onSave={(d) => (d.id ? update(d.id, payloadOf(d)) : create(payloadOf(d)))}
        />
      )}
    </div>
  );
}

function AboutEditor({
  draft: initial,
  chapters,
  onClose,
  onSave,
}: {
  draft: Draft;
  chapters: AboutSection[];
  onClose: () => void;
  onSave: (draft: Draft) => Promise<string | null>;
}) {
  // A long text: neither Escape nor a click outside may throw away what was typed.
  const { closing, close } = useModalClose(onClose, { closeOnEscape: false });
  const [draft, setDraft] = useState(initial);
  const [lang, setLang] = useState<Lang>("ru");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const current = LANGS.find((l) => l.id === lang)!;
  const filled = filledLanguages(draft);
  const kind = draft.isChapter ? "главу" : "раздел";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.isChapter && !draft.parentId) {
      setError("Выберите главу, в которую входит раздел");
      return;
    }
    setIsSaving(true);
    const message = await onSave(draft);
    setIsSaving(false);
    if (message) {
      setError(message);
      return;
    }
    close();
  }

  return (
    <div className={`modal-overlay fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4 ${closing ? "is-closing" : ""}`}>
      <form onSubmit={handleSubmit} className="modal-panel max-h-[92vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          {draft.id ? "Изменить" : "Добавить"} {kind}
        </h2>

        {!draft.isChapter && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Глава</label>
            <select
              value={draft.parentId ?? ""}
              onChange={(e) => setDraft({ ...draft, parentId: e.target.value || null })}
              className={inputClass}
              required
            >
              <option value="">— выберите —</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.titleRu}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap gap-1 border-b border-gray-200" role="group" aria-label="Язык">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lang === l.id}
              onClick={() => setLang(l.id)}
              className={`-mb-px rounded-t-md border px-3 py-1.5 text-sm font-medium ${
                lang === l.id ? "border-gray-200 border-b-white bg-white text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {l.label}
              <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${filled[l.id] ? "bg-green-500" : "bg-gray-300"}`} aria-hidden="true" />
              <span className="sr-only">{filled[l.id] ? " — есть текст" : " — нет текста"}</span>
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Заголовок ({current.name})</label>
          <input
            type="text"
            value={draft[current.title]}
            onChange={(e) => setDraft({ ...draft, [current.title]: e.target.value })}
            maxLength={200}
            required={lang === "ru"}
            className={inputClass}
          />
          {lang !== "ru" && <p className="mt-1 text-xs text-gray-500">Пусто — на этом языке покажется русский заголовок.</p>}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Текст ({current.name}){draft.isChapter ? " — вводный, необязательно" : ""}
            </label>
            <button type="button" onClick={() => setPreview((v) => !v)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
              {preview ? "Редактировать" : "Предпросмотр"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[16rem] rounded-md border border-gray-200 p-3">
              {draft[current.body].trim() ? <RichText text={draft[current.body]} /> : <p className="text-sm italic text-gray-500">Пусто</p>}
            </div>
          ) : (
            <textarea
              value={draft[current.body]}
              onChange={(e) => setDraft({ ...draft, [current.body]: e.target.value })}
              rows={16}
              maxLength={ABOUT_BODY_MAX}
              className={`${inputClass} font-mono text-[13px] leading-relaxed`}
            />
          )}
          {lang !== "ru" && !preview && <p className="mt-1 text-xs text-gray-500">Пусто — покажется русский текст.</p>}
          <details className="mt-2 text-xs text-gray-600">
            <summary className="cursor-pointer text-gray-700">Как оформлять текст</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-gray-50 p-3 font-mono text-[12px] leading-relaxed text-gray-700">{`Абзацы разделяются пустой строкой.
## Подзаголовок
- пункт списка
1. пункт нумерованного списка
> важное замечание (выноска)
**жирный текст**   [ссылка](https://example.com)

| Колонка 1 | Колонка 2 |
|---|---|
| ячейка | ячейка |`}</pre>
          </details>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} />
          Показывать на главной
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={close} className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Отмена
          </button>
          <button type="submit" disabled={isSaving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
