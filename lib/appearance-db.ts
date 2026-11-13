import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { APPEARANCE_KEY, DEFAULT_APPEARANCE, parseAppearance, type Appearance } from "@/lib/appearance";

/**
 * The options of the page background. Never throws: until the migration that creates the SiteSetting table
 * has run (or if the database hiccups) the portal must still open, just with the default decoration.
 */
export async function getAppearance(): Promise<Appearance> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: APPEARANCE_KEY } });
    return row ? parseAppearance(row.value) : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export async function saveAppearance(value: Appearance): Promise<Appearance> {
  const json = { glow: value.glow, mountains: value.mountains, snow: value.snow } satisfies Prisma.InputJsonObject;
  const row = await prisma.siteSetting.upsert({
    where: { key: APPEARANCE_KEY },
    create: { key: APPEARANCE_KEY, value: json },
    update: { value: json },
  });
  return parseAppearance(row.value);
}
