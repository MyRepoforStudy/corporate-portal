"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
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

/** Lower case, "ё" as "е": a search for "Фёдоров" finds "Федоров" and the other way round. */
const normalize = (text: string) => text.toLowerCase().replace(/ё/g, "е");

export function UsersAdmin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // The spinner only for the first load: after a change the list is refreshed in
  // place, so the page does not jump away from the user being edited.
  async function load(initial = false) {
    if (initial) setIsLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setIsLoading(false);
  }

  useEffect(() => {
    load(true);
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

  // Every word of the query must occur in the name, e-mail or login ("иванов ив" finds "Иванов Иван").
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible =
    words.length === 0
      ? users
      : users.filter((user) => {
          const haystack = normalize(`${user.displayName} ${user.email} ${user.ldapUid}`);
          return words.every((word) => haystack.includes(word));
        });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>
      <p className="text-sm text-gray-500">
        Список формируется автоматически при первом входе через LDAP. Роль назначается вручную.
      </p>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: имя, e-mail или логин"
          aria-label="Поиск пользователей"
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <>
          {words.length > 0 && (
            <p className="text-xs text-gray-500">
              Найдено: {visible.length} из {users.length}
            </p>
          )}
          {visible.length === 0 ? (
            <p className="text-sm text-gray-500">{users.length === 0 ? "Пользователей пока нет." : "Никого не найдено."}</p>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {visible.map((user) => (
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
        </>
      )}
    </div>
  );
}
