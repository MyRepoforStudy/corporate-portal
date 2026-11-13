/**
 * Who is offered room booking in the portal: administrators and users an
 * administrator has granted it to (User.canBookRooms, Admin → Пользователи).
 * Everyone else does not see the "Бронирование" tab or the links to it. The API
 * enforces the same rule (requireBookingPermission in lib/rbac.ts, which reads
 * the flag fresh from the database), so this only decides what is shown.
 */
export function hasBookingAccess(user: { role: string; canBookRooms?: boolean | null }): boolean {
  return user.role === "ADMIN" || user.canBookRooms === true;
}
