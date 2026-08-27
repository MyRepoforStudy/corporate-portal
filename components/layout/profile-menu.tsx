"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, User } from "lucide-react";

export function ProfileMenu({
  name,
  departmentName,
  photoUrl,
  profileLabel,
  signOutLabel,
}: {
  name: string;
  departmentName: string | null;
  photoUrl: string | null;
  profileLabel: string;
  signOutLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full px-1.5 py-1 transition hover:bg-gray-50"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-8 w-8 rounded-full border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-medium text-gray-500">
            {(name || "?").charAt(0)}
          </div>
        )}
        <span className="hidden leading-tight text-left sm:block">
          <span className="block text-sm text-gray-700">{name}</span>
          {departmentName && <span className="block text-xs text-gray-400">{departmentName}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <User className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            {profileLabel}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            {signOutLabel}
          </button>
        </div>
      )}
    </div>
  );
}
