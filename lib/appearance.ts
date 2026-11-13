import { z } from "zod";

// Look of the portal that the administrator switches in Admin -> Оформление: three independent layers
// behind / over the pages (components/layout/portal-background.tsx). Pure and database-free, so the
// admin page (browser) and the layout (server) share the same types and defaults.

/** The row of the SiteSetting table that holds these options. */
export const APPEARANCE_KEY = "appearance";

export interface Appearance {
  /** Soft colored glow that slowly drifts behind the cards. */
  glow: boolean;
  /** Silhouette of the Almaty mountains at the bottom of the page. */
  mountains: boolean;
  /** Falling snow over the page (winter, New Year). */
  snow: boolean;
}

/** What everybody sees until the administrator saves something else. */
export const DEFAULT_APPEARANCE: Appearance = { glow: true, mountains: true, snow: false };

/** What the admin form sends: every option must be present and a real boolean. */
export const appearanceInputSchema = z.object({
  glow: z.boolean(),
  mountains: z.boolean(),
  snow: z.boolean(),
});

// Reading is forgiving: a missing or broken field falls back to its default instead of breaking every page.
const stored = z.object({
  glow: z.boolean().catch(DEFAULT_APPEARANCE.glow),
  mountains: z.boolean().catch(DEFAULT_APPEARANCE.mountains),
  snow: z.boolean().catch(DEFAULT_APPEARANCE.snow),
});

/** The stored JSON (anything) -> valid options; unknown keys are dropped, missing or wrong ones get the defaults. */
export function parseAppearance(value: unknown): Appearance {
  const object = typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
  return stored.parse(object);
}

/** A short text for the audit log: "свечение: вкл, горы: вкл, снег: выкл". */
export function describeAppearance(value: Appearance): string {
  const state = (on: boolean) => (on ? "вкл" : "выкл");
  return `свечение: ${state(value.glow)}, горы: ${state(value.mountains)}, снег: ${state(value.snow)}`;
}
