"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}
