"use client";

import { X } from "lucide-react";

export function PhotoLightbox({
  src,
  onClose,
  closeLabel = "Закрыть",
}: {
  src: string;
  onClose: () => void;
  closeLabel?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute right-4 top-4 text-white/80 hover:text-white"
      >
        <X className="h-6 w-6" aria-hidden="true" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[85vw] select-none rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}

/** Small wrapper: renders a photo that opens it full-size on click without
 * triggering a parent row/card's own onClick (stopPropagation). */
export function ClickablePhoto({
  src,
  size,
  fallbackText,
  className,
  style: extraStyle,
  isOpen,
  onOpen,
  onClose,
  openLabel = "Открыть фото",
  closeLabel = "Закрыть",
}: {
  src: string | null;
  size: number;
  fallbackText: string;
  className?: string;
  style?: React.CSSProperties;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  openLabel?: string;
  closeLabel?: string;
}) {
  const style = { width: size, height: size, ...extraStyle };

  if (!src) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 font-medium text-gray-500 ${className ?? ""}`}
        style={style}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={openLabel}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onOpen();
          }
        }}
        className={`shrink-0 cursor-zoom-in ${className ?? ""}`}
        style={style}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none rounded-full border border-gray-200 object-cover"
        />
      </div>
      {isOpen && <PhotoLightbox src={src} onClose={onClose} closeLabel={closeLabel} />}
    </>
  );
}
