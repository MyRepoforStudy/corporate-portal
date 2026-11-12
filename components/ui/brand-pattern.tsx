/**
 * Abstract geometric pattern in the brand red family - deliberately not a
 * stock "our building" photo, since this is a real bank's internal portal and
 * a generic stock photo presented as "our HQ" would be misleading.
 * Same rotated-square motif as SideDecoration (components/layout/side-decoration.tsx).
 * Put it first inside a `relative overflow-hidden` red surface, with the real
 * content in a `relative` sibling after it.
 */
const SQUARES = {
  // The banner on the home page
  hero: [
    { size: 160, top: "-20%", right: "4%", rotate: 18, opacity: 0.16 },
    { size: 100, top: "40%", right: "18%", rotate: -12, opacity: 0.14 },
    { size: 70, top: "68%", right: "2%", rotate: 24, opacity: 0.18 },
  ],
  // The tall panel next to the login form
  panel: [
    { size: 340, top: "-6%", right: "-10%", rotate: 18, opacity: 0.12 },
    { size: 200, top: "40%", right: "16%", rotate: -12, opacity: 0.1 },
    { size: 140, top: "70%", right: "-3%", rotate: 24, opacity: 0.14 },
  ],
};

export function BrandPattern({ variant = "hero" }: { variant?: keyof typeof SQUARES }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {SQUARES[variant].map((sq, i) => (
        <div
          key={i}
          className="absolute rounded-2xl bg-white"
          style={{
            width: sq.size,
            height: sq.size,
            top: sq.top,
            right: sq.right,
            opacity: sq.opacity,
            transform: `rotate(${sq.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
