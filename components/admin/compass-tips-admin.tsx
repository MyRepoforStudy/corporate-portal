"use client";

import { useState, type FormEvent } from "react";
import type { CompassTip } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = { title: "", content: "", order: "0" };

export function CompassTipsAdmin() {
  const { items, isLoading, create, update, remove } =
    useCrudList<CompassTip>("/api/compass-tips");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      content: form.content,
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

  function startEdit(tip: CompassTip) {
    setEditingId(tip.id);
    setForm({
      title: tip.title,
      content: tip.content,
      order: String(tip.order),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить совет?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Компас новичка</h1>
        <p className="text-sm text-gray-500">
          Советы и факты для новых сотрудников (дресс-код, первые дни, полезные контакты и т.п.) —
          отображаются на странице «Компас новичка» у всех сотрудников.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="text"
          placeholder="Заголовок (например, Дресс-код)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />
        <textarea
          placeholder="Текст совета"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />
        <input
          type="number"
          min={0}
          placeholder="Порядок сортировки"
          value={form.order}
          onChange={(e) => setForm({ ...form, order: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm sm:w-48"
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {editingId ? "Сохранить" : "Добавить совет"}
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
          {items.map((tip) => (
            <div key={tip.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                <p className="whitespace-pre-line text-xs text-gray-500">{tip.content}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(tip)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(tip.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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
