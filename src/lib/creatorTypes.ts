/**
 * Single source of truth for all 13 Creator Type colours and glyphs.
 * Colours match the official "Creator Families + Team Roles" PDF chart.
 */

export const CREATOR_TYPE_COLORS: Record<string, string> = {
  lava:      "#E85500",
  fire:      "#F07000",
  whirlwind: "#2D7A00",
  sun:       "#F5A300",
  lightning: "#7CC800",
  snow:      "#00B887",
  sky:       "#5BB8D4",
  mountain:  "#BE1558",
  tree:      "#b00000",
  soil:      "#8B1717",
  river:     "#00AAEE",
  ocean:     "#1B3FB5",
  lake:      "#00A8CC",
};

/** Ordered list of all creator type names (title case, matching DB). */
export const CREATOR_TYPE_NAMES = [
  "Lava", "Fire", "Whirlwind",
  "Sun", "Lightning", "Snow", "Sky",
  "Mountain", "Tree", "Soil",
  "River", "Ocean", "Lake",
] as const;

/** Returns the hex colour for a creator type name (case-insensitive). Falls back to a neutral. */
export function getCreatorTypeColor(name: string): string {
  return CREATOR_TYPE_COLORS[name.toLowerCase()] ?? "#888888";
}
