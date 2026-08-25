"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Role } from "@prisma/client";
import { VacationGauge } from "@/components/profile/vacation-gauge";
import type { Dictionary } from "@/lib/i18n";

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
  activityArea: string | null;
  department: string;
  position: string;
  workplace: { building: string | null; floor: number; room: string; deskNumber: string } | null;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
}

export function ProfileForm({
  account,
  employee,
  dict,
}: {
  account: Account;
  employee: EmployeeProfile | null;
  dict: Dictionary["profile"];
}) {
  const roleLabels: Record<Role, string> = dict.roles;
  const [form, setForm] = useState({
    phone: employee?.phone ?? "",
    email: employee?.email ?? account.email,
    photoUrl: employee?.photoUrl ?? "",
    bio: employee?.bio ?? "",
    activityArea: employee?.activityArea ?? "",
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
      setError(responseBody?.error ?? dict.uploadPhotoError);
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
      setError(body?.error ?? dict.saveError);
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">{dict.fullName}</p>
            <p className="text-gray-900">{account.displayName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{dict.login}</p>
            <p className="text-gray-900">{account.ldapUid}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{dict.role}</p>
            <p className="text-gray-900">{roleLabels[account.role]}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{dict.bookingAccess}</p>
            <p className={canBook ? "text-green-700 dark:text-green-400" : "text-gray-500"}>
              {canBook ? dict.available : dict.unavailable}
            </p>
          </div>
          {employee && (
            <>
              <div>
                <p className="text-xs text-gray-500">{dict.department}</p>
                <p className="text-gray-900">{employee.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{dict.position}</p>
                <p className="text-gray-900">{employee.position}</p>
              </div>
              {employee.workplace && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">{dict.workplace}</p>
                  <p className="text-gray-900">
                    {[employee.workplace.building, `${employee.workplace.floor} ${dict.floor}`, employee.workplace.room, employee.workplace.deskNumber]
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
              <p className="text-xs text-gray-500">{dict.vacationRemaining}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {employee.vacationDaysTotal - employee.vacationDaysUsed}{" "}
                <span className="text-sm font-normal text-gray-500">
                  {dict.vacationOf
                    .replace("{total}", String(employee.vacationDaysTotal))
                    .replace("{used}", String(employee.vacationDaysUsed))}
                </span>
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2"
          >
            <h2 className="text-sm font-medium text-gray-900 sm:col-span-2">{dict.editTitle}</h2>
            <input
              type="email"
              placeholder={dict.emailPlaceholder}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder={dict.phonePlaceholder}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder={dict.activityAreaPlaceholder}
              value={form.activityArea}
              onChange={(e) => setForm({ ...form, activityArea: e.target.value })}
              className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm sm:col-span-2"
            />

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500">{dict.photoLabel}</label>
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
                {isUploading && <span className="text-xs text-gray-500">{dict.uploading}</span>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500">{dict.bioLabel}</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{error}</p>}
            {success && <p className="text-sm text-green-700 dark:text-green-400 sm:col-span-2">{dict.saveSuccess}</p>}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {dict.save}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          {dict.notLinked}
        </div>
      )}
    </div>
  );
}
