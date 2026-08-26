"use client";

import { useState } from "react";
import { ClickablePhoto } from "@/components/ui/photo-lightbox";
import { formatDateLong } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n";

export function WelcomeHero({
  fullName,
  positionTitle,
  departmentName,
  hireDate,
  photoUrl,
  progressPercent,
  locale,
  title,
  subtitle,
  hireDateLabel,
  progressLabel,
  openPhotoLabel,
  closePhotoLabel,
}: {
  fullName: string;
  positionTitle: string;
  departmentName: string;
  hireDate: Date | null;
  photoUrl: string | null;
  progressPercent: number;
  locale: Locale;
  title: string;
  subtitle: string;
  hireDateLabel: string;
  progressLabel: string;
  openPhotoLabel: string;
  closePhotoLabel: string;
}) {
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ClickablePhoto
            src={photoUrl}
            size={72}
            isOpen={isPhotoOpen}
            onOpen={() => setIsPhotoOpen(true)}
            onClose={() => setIsPhotoOpen(false)}
            openLabel={openPhotoLabel}
            closeLabel={closePhotoLabel}
          />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">{title.replace("{name}", fullName)}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
            <p className="mt-1 text-sm text-gray-600">
              {positionTitle} · {departmentName}
            </p>
            {hireDate && (
              <p className="text-xs text-gray-400">
                {hireDateLabel}: {formatDateLong(hireDate, locale, true)}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs uppercase tracking-wide text-gray-400">{progressLabel}</p>
          <p className="text-2xl font-semibold text-brand-600">{progressPercent}%</p>
        </div>
      </div>
    </div>
  );
}
