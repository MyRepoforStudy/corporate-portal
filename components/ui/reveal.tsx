import type { ReactNode } from "react";

/** A block that fades in and rises a little when the page opens. Give blocks that
 * sit near each other consecutive `index` values and they appear one after
 * another (70 ms apart). Server-component friendly: it is only a class and a
 * delay; the keyframes live in globals.css and respect prefers-reduced-motion. */
export function Reveal({
  index = 0,
  className = "",
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`reveal ${className}`} style={{ animationDelay: `${index * 70}ms` }}>
      {children}
    </div>
  );
}
