import type { CSSProperties } from "react";

// Purely decorative brand mark for the empty margins on very wide screens
// (content itself caps at max-w-[1600px] for readability - see layout.tsx).
// Plays a one-time fade/slide-in on mount (globals.css .mark-enter), then
// stays still - a continuous "breathing" loop was tried earlier and
// explicitly rejected as distracting, so this never repeats or loops.
// Lives in the layout (outside template.tsx), so it only plays once per
// hard page load, not on every client-side navigation.
function Mark({
  side,
  top,
  size,
  rotate,
  delay,
}: {
  side: "left" | "right";
  top: string;
  size: number;
  rotate: number;
  delay: number;
}) {
  return (
    <div
      className="mark-enter absolute rounded-md"
      style={
        {
          [side]: size * 0.4,
          top,
          width: size,
          height: size,
          backgroundColor: "#D80010",
          animationDelay: `${delay}ms`,
          "--mark-rotate": `rotate(${rotate}deg)`,
        } as CSSProperties
      }
    />
  );
}

const MARKS: { top: string; size: number; rotate: number; delay: number }[] = [
  { top: "6%", size: 115, rotate: 18, delay: 0 },
  { top: "34%", size: 72, rotate: -14, delay: 90 },
  { top: "58%", size: 92, rotate: 10, delay: 180 },
  { top: "82%", size: 60, rotate: -20, delay: 270 },
];

export function SideDecoration() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {MARKS.map((mark, i) => (
        <Mark key={`l-${i}`} side="left" {...mark} />
      ))}
      {MARKS.map((mark, i) => (
        <Mark key={`r-${i}`} side="right" {...mark} />
      ))}
    </div>
  );
}
