"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Role } from "@prisma/client";
import { VacationGauge } from "@/components/profile/vacation-gauge";

interface Account {
  displayName: string;
  email: string;
  ldapUid: string;
  role: Role;
  canBookRooms: boolean;
}

interface EmployeeProfile {
  fullName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  department: string;
  position: string;
  workplace: { building: string | null; floor: number; room: string; deskNumber: string } | null;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Администратор",
  HR: "HR",
  EMPLOYEE: "Сотрудник",
};

export function ProfileForm({
  account,
  employee,
}: {
  account: Account;
  employee: EmployeeProfile | null;
}) {
  const [form, setForm] = useState({
    phone: employee?.phone ?? "",
    email: employee?.email ?? account.email,
    photoUrl: employee?.photoUrl ?? "",
    bio: employee?.bio ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canBook = account.role === "ADMIN" || account.canBookRooms;

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
    setSuccess(false);
    setIsSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось сохранить изменения");
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">ФИО</p>
            <p className="text-gray-900">{account.displayName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Логин</p>
            <p className="text-gray-900">{account.ldapUid}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Роль</p>
            <p className="text-gray-900">{ROLE_LABELS[account.role]}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Бронирование переговорных</p>
            <p className={canBook ? "text-green-700 dark:text-green-400" : "text-gray-500"}>
              {canBook ? "Доступно" : "Недоступно"}
            </p>
          </div>
          {employee && (
            <>
              <div>
                <p className="text-xs text-gray-500">Отдел</p>
                <p className="text-gray-900">{employee.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Должность</p>
                <p className="text-gray-900">{employee.position}</p>
              </div>
              {employee.workplace && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">Рабочее место</p>
                  <p className="text-gray-900">
                    {[employee.workplace.building, `${employee.workplace.floor} этаж`, employee.workplace.room, employee.workplace.deskNumber]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {employee ? (
        <>
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <VacationGauge total={employee.vacationDaysTotal} used={employee.vacationDaysUsed} />
            <div>
              <p className="text-xs text-gray-500">Остаток отпуска</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {employee.vacationDaysTotal - employee.vacationDaysUsed}{" "}
                <span className="text-sm font-normal text-gray-500">
                  из {employee.vacationDaysTotal} дней (использовано {employee.vacationDaysUsed})
                </span>
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2"
          >
            <h2 className="text-sm font-medium text-gray-900 sm:col-span-2">Редактировать профиль</h2>
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

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Фото</label>
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
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500">О себе</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{error}</p>}
            {success && <p className="text-sm text-green-700 dark:text-green-400 sm:col-span-2">Изменения сохранены</p>}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Профиль не привязан к записи сотрудника в оргструктуре. Обратитесь в HR.
        </div>
      )}
    </div>
  );
}
