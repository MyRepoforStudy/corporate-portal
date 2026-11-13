import type { CSSProperties } from "react";
import type { Appearance } from "@/lib/appearance";

// The decoration of the portal that Admin -> Оформление switches: a soft glow, the Almaty mountains and snow.
// Pure markup (no state, no scripts); the look and the motion are in globals.css ("Portal background").
// Two layers that never take a click:
//   - back: glow + mountains, behind the page (above the white canvas, below the cards);
//   - snow: falls over the page, under menus, dialogs and toasts.
// `contained` fits the layers into a parent that is `relative overflow-hidden` (the preview in the admin)
// instead of the whole window.

// --- snow ---------------------------------------------------------------------------

/** Small deterministic generator: the flakes are the same on every render (no random markup, no jumps). */
function seeded(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Flake {
  left: number;
  size: number;
  alpha: number;
  seconds: number;
  delay: number;
  dx: number;
}

const FLAKES: Flake[] = (() => {
  const random = seeded(2611);
  return Array.from({ length: 46 }, (_, i) => {
    const depth = i % 3; // 0: far (small, slow), 1: middle, 2: near (bigger, faster)
    const seconds = [20, 13, 8][depth] + random() * 5;
    return {
      left: Math.round(random() * 990) / 10,
      size: [2, 3, 5][depth],
      alpha: [0.5, 0.65, 0.85][depth],
      seconds: Math.round(seconds * 10) / 10,
      delay: -Math.round(random() * seconds * 10) / 10,
      dx: Math.round((random() - 0.5) * 90),
    };
  });
})();

// --- mountains ----------------------------------------------------------------------
// Drawn in a 1440 x 400 box and stretched over the window width.

type Point = [number, number];

const FAR_RIDGE: Point[] = [
  [0, 250], [70, 205], [140, 232], [230, 140], [300, 188], [385, 112], [455, 170], [545, 88], [615, 158], [705, 104],
  [790, 182], [885, 64], [965, 148], [1045, 98], [1125, 172], [1215, 114], [1290, 166], [1365, 130], [1440, 186],
];

const MID_RIDGE: Point[] = [
  [0, 322], [100, 284], [190, 314], [290, 252], [380, 302], [470, 270], [560, 308], [670, 242], [760, 298], [850, 258],
  [960, 304], [1070, 248], [1170, 304], [1270, 268], [1360, 304], [1440, 280],
];

const NEAR_FOOTHILLS =
  "M0 352 C120 326 240 346 360 334 C480 322 600 350 720 338 C840 326 960 348 1080 336 C1200 324 1320 346 1440 332 L1440 400 L0 400 Z";

const round = (n: number) => Math.round(n * 10) / 10;

/** A closed silhouette: the ridge line, then down to the bottom edge of the box. */
function ridgePath(points: Point[]): string {
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const last = points[points.length - 1];
  return `${line} L${last[0]} 400 L${points[0][0]} 400 Z`;
}

/**
 * Snow caps on the high peaks: the part of the peak above a jagged "snow line". Its sides follow the ridge
 * lines exactly, so a cap never sticks out of the mountain.
 */
function snowCaps(points: Point[], highest: number): string {
  const caps: string[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const [lx, ly] = points[i - 1];
    const [rx, ry] = points[i + 1];
    if (py >= highest || py >= ly || py >= ry) continue;
    const depth = Math.min(30 + (highest - py) * 0.45, ly - py - 4, ry - py - 4);
    const edge = (below: number): [number, number] => [
      px + (lx - px) * (below / (ly - py)),
      px + (rx - px) * (below / (ry - py)),
    ];
    const at = (fraction: number, share: number): string => {
      const [left, right] = edge(depth * share);
      return `L${round(left + (right - left) * fraction)} ${round(py + depth * share)}`;
    };
    const [left, right] = edge(depth);
    caps.push(
      `M${px} ${py} L${round(left)} ${round(py + depth)} ${at(0.22, 0.6)} ${at(0.4, 0.98)} ${at(0.58, 0.62)} ${at(0.78, 1)} L${round(right)} ${round(py + depth)} Z`
    );
  }
  return caps.join(" ");
}

const FAR_PATH = ridgePath(FAR_RIDGE);
const FAR_CAPS = snowCaps(FAR_RIDGE, 130);
const MID_PATH = ridgePath(MID_RIDGE);

function Mountain({ layer, children }: { layer: "far" | "mid" | "near"; children: React.ReactNode }) {
  return (
    <svg className={`mtn mtn--${layer}`} viewBox="0 0 1440 400" preserveAspectRatio="none" focusable="false">
      {children}
    </svg>
  );
}

export function PortalBackground({ appearance, contained = false }: { appearance: Appearance; contained?: boolean }) {
  const mode = contained ? " is-contained" : "";

  return (
    <>
      {(appearance.glow || appearance.mountains) && (
        <div aria-hidden="true" className={`portal-bg portal-bg--back${mode}`}>
          {appearance.glow && (
            <>
              <div className="glow-blob glow-blob--red" />
              <div className="glow-blob glow-blob--warm" />
              <div className="glow-blob glow-blob--violet" />
            </>
          )}
          {appearance.mountains && (
            <>
              <Mountain layer="far">
                <path className="ridge" d={FAR_PATH} />
                <path className="caps" d={FAR_CAPS} />
              </Mountain>
              <Mountain layer="mid">
                <path className="ridge" d={MID_PATH} />
              </Mountain>
              <Mountain layer="near">
                <path className="ridge" d={NEAR_FOOTHILLS} />
              </Mountain>
            </>
          )}
        </div>
      )}
      {appearance.snow && (
        <div aria-hidden="true" className={`portal-bg portal-bg--snow${mode}`}>
          {FLAKES.map((flake, i) => (
            <span
              key={i}
              className="flake"
              style={
                {
                  left: `${flake.left}%`,
                  width: flake.size,
                  height: flake.size,
                  "--a": flake.alpha,
                  "--t": `${flake.seconds}s`,
                  "--d": `${flake.delay}s`,
                  "--dx": `${flake.dx}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
