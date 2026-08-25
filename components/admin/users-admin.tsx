"use client";

import { useEffect, useState } from "react";
import type { Role } from "@prisma/client";

interface UserRow {
  id: string;
  ldapUid: string;
  email: string;
  displayName: string;
  role: Role;
  canBookRooms: boolean;
  lastLoginAt: string | null;
}

export function UsersAdmin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRoleChange(id: string, role: Role) {
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      load();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось изменить роль");
    }
  }

  async function handleBookingPermissionChange(id: string, canBookRooms: boolean) {
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canBookRooms }),
    });
    if (res.ok) {
      load();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось изменить право бронирования");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>
      <p className="text-sm text-gray-500">
        Список формируется автоматически при первом входе через LDAP. Роль назначается вручную.
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">
                  {user.email} · логин: {user.ldapUid}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={user.role === "ADMIN" || user.canBookRooms}
                    disabled={user.role === "ADMIN"}
                    title={user.role === "ADMIN" ? "Администратор всегда может бронировать" : undefined}
                    onChange={(e) => handleBookingPermissionChange(user.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Бронирование
                </label>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                  className="rounded-md border border-gray-300 bg-white text-gray-900 px-2 py-1.5 text-sm"
                >
                  <option value="EMPLOYEE">Сотрудник</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
