"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Department } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

type DepartmentWithCount = Department & { _count: { employees: number } };

function buildLabels(departments: DepartmentWithCount[]): Map<string, string> {
  const byId = new Map(departments.map((d) => [d.id, d]));
  const labels = new Map<string, string>();

  function depth(dept: DepartmentWithCount): number {
    let d = 0;
    let current = dept;
    while (current.parentId && byId.has(current.parentId)) {
      d += 1;
      current = byId.get(current.parentId)!;
    }
    return d;
  }

  for (const dept of departments) {
    labels.set(dept.id, `${"— ".repeat(depth(dept))}${dept.name}`);
  }
  return labels;
}

const emptyForm = { name: "", parentId: "" };

export function DepartmentsAdmin() {
  const { items, isLoading, create, update, remove } =
    useCrudList<DepartmentWithCount>("/api/departments");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const labels = useMemo(() => buildLabels(items), [items]);
  const sorted = useMemo(
    () => [...items].sort((a, b) => (labels.get(a.id) ?? "").localeCompare(labels.get(b.id) ?? "")),
    [items, labels]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = { name: form.name, parentId: form.parentId || null };
    const result = editingId ? await update(editingId, payload) : await create(payload);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(dept: Department) {
    setEditingId(dept.id);
    setForm({ name: dept.name, parentId: dept.parentId ?? "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить отдел? Возможно только если в нём нет сотрудников и подотделов.")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Отделы</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Название</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Родительский отдел</label>
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">— нет (верхний уровень) —</option>
            {sorted
              .filter((d) => d.id !== editingId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {labels.get(d.id)}
                </option>
              ))}
          </select>
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
            onClick={cancelEdit}
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
          {sorted.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-gray-800">{labels.get(dept.id)}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{dept._count.employees} сотр.</span>
                <button onClick={() => startEdit(dept)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(dept.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
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
