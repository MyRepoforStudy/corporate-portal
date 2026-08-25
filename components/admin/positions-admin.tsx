"use client";

import { useState, type FormEvent } from "react";
import type { Position } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = { title: "", rank: "0" };

export function PositionsAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<Position>("/api/positions");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const data = { title: form.title, rank: Number(form.rank) };
    const result = editingId ? await update(editingId, data) : await create(data);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить должность? Возможно только если её никто не занимает.")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Должности</h1>
        <p className="text-sm text-gray-500">
          Старшинство влияет на порядок сотрудников внутри отдела в оргструктуре — чем выше
          число, тем выше должность считается в иерархии (0 — по умолчанию, без ранга).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Название должности</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Старшинство</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={form.rank}
            onChange={(e) => setForm({ ...form, rank: e.target.value })}
            className="w-24 rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {editingId ? "Сохранить" : "Добавить"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Отмена
          </button>
        )}
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {items.map((position) => (
            <div key={position.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-gray-800">
                {position.title}
                <span className="ml-2 text-xs text-gray-500">старшинство: {position.rank}</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditingId(position.id);
                    setForm({ title: position.title, rank: String(position.rank) });
                  }}
                  className="text-sm text-brand-700 hover:underline dark:text-brand-300"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(position.id)}
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
