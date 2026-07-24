"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download } from "lucide-react";
import type { Department, Employee, Position } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";
import { toDateInputValue } from "@/lib/booking-time";

type EmployeeWithRelations = Employee & { department: Department; position: Position };

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  photoUrl: "",
  birthDate: "",
  hireDate: "",
  departmentId: "",
  positionId: "",
};

function VacationEditor({ employee, onSaved }: { employee: EmployeeWithRelations; onSaved: () => void }) {
  const [total, setTotal] = useState(String(employee.vacationDaysTotal));
  const [used, setUsed] = useState(String(employee.vacationDaysUsed));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = Number(total) !== employee.vacationDaysTotal || Number(used) !== employee.vacationDaysUsed;

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    const res = await fetch(`/api/employees/${employee.id}/vacation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vacationDaysTotal: Number(total), vacationDaysUsed: Number(used) }),
    });
    setIsSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось сохранить отпуск");
      return;
    }
    onSaved();
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
      <span>Отпуск:</span>
      <input
        type="number"
        min={0}
        max={365}
        value={used}
        onChange={(e) => setUsed(e.target.value)}
        className="w-14 rounded-md border border-gray-300 px-1.5 py-1 text-center"
        title="Использовано дней"
      />
      <span>/</span>
      <input
        type="number"
        min={0}
        max={365}
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        className="w-14 rounded-md border border-gray-300 px-1.5 py-1 text-center"
        title="Норма дней"
      />
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-brand-700 hover:underline disabled:opacity-50 dark:text-brand-300"
        >
          Сохранить
        </button>
      )}
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}

export function EmployeesAdmin() {
  const { items, isLoading, create, update, remove, reload } =
    useCrudList<EmployeeWithRelations>("/api/employees");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then(setDepartments);
    fetch("/api/positions")
      .then((r) => r.json())
      .then(setPositions);
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const body = new FormData();
    body.append("image", file);

    const res = await fetch("/api/employees/upload", { method: "POST", body });
    setIsUploading(false);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      setError(responseBody?.error ?? "Не удалось загрузить фото");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { url } = await res.json();
    setForm((f) => ({ ...f, photoUrl: url }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = editingId ? await update(editingId, form) : await create(form);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(employee: EmployeeWithRelations) {
    setEditingId(employee.id);
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone ?? "",
      photoUrl: employee.photoUrl ?? "",
      birthDate: employee.birthDate ? toDateInputValue(new Date(employee.birthDate)) : "",
      hireDate: employee.hireDate ? toDateInputValue(new Date(employee.hireDate)) : "",
      departmentId: employee.departmentId,
      positionId: employee.positionId,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить сотрудника?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Сотрудники</h1>
        <a
          href="/api/admin/employees/export"
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Экспорт в CSV
        </a>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="ФИО"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <input
          type="text"
          placeholder="Телефон"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <div>
          <label className="mb-1 block text-xs text-gray-500">Дата рождения (необязательно)</label>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Дата приёма на работу (необязательно)</label>
          <input
            type="date"
            value={form.hireDate}
            onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-500">Фото (необязательно)</label>
          <div className="flex items-center gap-3">
            {form.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.photoUrl}
                alt=""
                className="h-12 w-12 rounded-full border border-gray-200 object-cover"
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
            {form.photoUrl && !isUploading && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, photoUrl: "" }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Убрать
              </button>
            )}
          </div>
        </div>

        <select
          value={form.departmentId}
          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        >
          <option value="">Отдел...</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={form.positionId}
          onChange={(e) => setForm({ ...form, positionId: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        >
          <option value="">Должность...</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {editingId ? "Сохранить" : "Добавить сотрудника"}
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
          {items.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                {employee.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employee.photoUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                    {employee.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{employee.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {employee.position.title} · {employee.department.name} · {employee.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <VacationEditor employee={employee} onSaved={reload} />
                <button
                  onClick={() => startEdit(employee)}
                  className="text-sm text-brand-700 hover:underline dark:text-brand-300"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
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
