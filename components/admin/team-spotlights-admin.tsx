"use client";

import { useRef, useState, type FormEvent } from "react";
import type { TeamSpotlight } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = { imageUrl: "", caption: "", order: "0" };

export function TeamSpotlightsAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<TeamSpotlight>("/api/team-spotlights");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const body = new FormData();
    body.append("image", file);

    const res = await fetch("/api/team-spotlights/upload", { method: "POST", body });
    setIsUploading(false);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      setError(responseBody?.error ?? "Не удалось загрузить фото");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { url } = await res.json();
    setForm((f) => ({ ...f, imageUrl: url }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = { imageUrl: form.imageUrl, caption: form.caption, order: Number(form.order) };
    const result = editingId ? await update(editingId, payload) : await create(payload);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(spotlight: TeamSpotlight) {
    setEditingId(spotlight.id);
    setForm({ imageUrl: spotlight.imageUrl, caption: spotlight.caption, order: String(spotlight.order) });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить фото?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Команда в деле</h1>
        <p className="text-sm text-gray-500">
          Фотовитрина на главной странице. Порядок — меньшее число показывается раньше.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Фото</label>
          <div className="flex items-center gap-3">
            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt=""
                className="h-16 w-24 rounded-md border border-gray-200 object-cover"
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="text-sm"
            />
            {isUploading && <span className="text-xs text-gray-500">Загрузка...</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">Подпись</label>
            <input
              type="text"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Порядок</label>
            <input
              type="number"
              min={0}
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className="w-20 rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {editingId ? "Сохранить" : "Добавить"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {items.map((spotlight) => (
            <div key={spotlight.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spotlight.imageUrl}
                  alt=""
                  className="h-10 w-16 shrink-0 rounded-md border border-gray-200 object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{spotlight.caption}</p>
                  <p className="text-xs text-gray-500">порядок: {spotlight.order}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => startEdit(spotlight)}
                  className="text-sm text-brand-700 hover:underline dark:text-brand-300"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(spotlight.id)}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
