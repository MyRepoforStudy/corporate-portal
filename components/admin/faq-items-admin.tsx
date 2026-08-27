"use client";

import { useState, type FormEvent } from "react";
import type { FaqItem } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = { question: "", answer: "", order: "0" };

export function FaqItemsAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<FaqItem>("/api/faq-items");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      question: form.question,
      answer: form.answer,
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

  function startEdit(item: FaqItem) {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
      order: String(item.order),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить вопрос?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">FAQ для новичков</h2>
        <p className="text-sm text-gray-500">
          Частые вопросы и ответы — показываются аккордеоном в «Компасе новичка».
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="text"
          placeholder="Вопрос"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />
        <textarea
          placeholder="Ответ"
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
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
            {editingId ? "Сохранить" : "Добавить вопрос"}
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
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.question}</p>
                <p className="whitespace-pre-line text-xs text-gray-500">{item.answer}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(item)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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
