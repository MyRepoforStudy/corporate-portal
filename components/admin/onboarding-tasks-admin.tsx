"use client";

import { useState, type FormEvent } from "react";
import type { OnboardingTask } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";
import { ONBOARDING_STAGES } from "@/lib/compass/mock-data";

const STAGE_LABELS: Record<string, string> = {
  "before-start": "До выхода",
  "first-day": "Первый день",
  "first-week": "Первая неделя",
  "first-month": "Первый месяц",
  "ninety-days": "90 дней",
};

const emptyForm = { title: "", stageId: ONBOARDING_STAGES[0].id, order: "0" };

export function OnboardingTasksAdmin() {
  const { items, isLoading, create, update, remove } =
    useCrudList<OnboardingTask>("/api/onboarding-tasks");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      stageId: form.stageId,
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

  function startEdit(task: OnboardingTask) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      stageId: task.stageId,
      order: String(task.order),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить задачу?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Задачи онбординга</h2>
        <p className="text-sm text-gray-500">
          Список задач по этапам адаптации — показывается в «Компасе новичка» на этапе, к которому
          привязана задача.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Название задачи"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm sm:col-span-2"
          required
        />
        <select
          value={form.stageId}
          onChange={(e) => setForm({ ...form, stageId: e.target.value })}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        >
          {ONBOARDING_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {STAGE_LABELS[stage.id]}
            </option>
          ))}
        </select>
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
            {editingId ? "Сохранить" : "Добавить задачу"}
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
          {items.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-500">{STAGE_LABELS[task.stageId] ?? task.stageId}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(task)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(task.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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
