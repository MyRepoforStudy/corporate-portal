"use client";

import { useState, type FormEvent } from "react";
import type { Room } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = { name: "", capacity: "", floor: "", equipment: "" };

export function RoomsAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<Room>("/api/rooms");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      name: form.name,
      capacity: Number(form.capacity),
      floor: Number(form.floor),
      equipment: form.equipment
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    const result = editingId ? await update(editingId, payload) : await create(payload);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(room: Room) {
    setEditingId(room.id);
    setForm({
      name: room.name,
      capacity: String(room.capacity),
      floor: String(room.floor),
      equipment: room.equipment.join(", "),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить переговорную?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Переговорные комнаты</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Название"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <input
          type="number"
          min={1}
          placeholder="Вместимость"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <input
          type="number"
          placeholder="Этаж"
          value={form.floor}
          onChange={(e) => setForm({ ...form, floor: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <input
          type="text"
          placeholder="Оборудование через запятую"
          value={form.equipment}
          onChange={(e) => setForm({ ...form, equipment: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {editingId ? "Сохранить" : "Добавить комнату"}
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
          {items.map((room) => (
            <div key={room.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{room.name}</p>
                <p className="text-xs text-gray-500">
                  {room.floor} этаж · до {room.capacity} чел.
                  {room.equipment.length > 0 && ` · ${room.equipment.join(", ")}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(room)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(room.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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
