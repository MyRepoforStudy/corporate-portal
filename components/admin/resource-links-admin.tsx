"use client";

import { useState, type FormEvent } from "react";
import type { ResourceLink } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = { title: "", url: "", description: "", order: "0" };

export function ResourceLinksAdmin() {
  const { items, isLoading, create, update, remove } =
    useCrudList<ResourceLink>("/api/resource-links");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      url: form.url,
      description: form.description,
      order: Number(form.order),
    };
    const result = editingId ? await update(editingId, payload) : await create(payload);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(link: ResourceLink) {
    setEditingId(link.id);
    setForm({
      title: link.title,
      url: link.url,
      description: link.description ?? "",
      order: String(link.order),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить ресурс?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Полезные ресурсы</h1>
        <p className="text-sm text-gray-500">
          Ссылки на внешние корпоративные сайты (Wiki, Redmine и т.п.), отображаются на главной
          странице у всех сотрудников
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Название (например, Wiki)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />
        <input
          type="url"
          placeholder="https://wiki.bank.local"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />
        <input
          type="text"
          placeholder="Краткое описание (необязательно)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="Порядок сортировки"
          value={form.order}
          onChange={(e) => setForm({ ...form, order: e.target.value })}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {editingId ? "Сохранить" : "Добавить ресурс"}
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
          {items.map((link) => (
            <div key={link.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{link.title}</p>
                <p className="text-xs text-gray-500">
                  {link.url}
                  {link.description && ` · ${link.description}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(link)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(link.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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
