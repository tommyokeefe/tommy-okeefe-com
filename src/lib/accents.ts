/**
 * Canonical accent color definitions for the site's runtime theming system.
 *
 * DESIGN: Accents persist for the entire session and do not re-roll on navigation.
 * This is intentional: <header> uses transition:persist, so it stays in the DOM
 * across view transitions. The data-header-accent attribute is set once on initial
 * page load and remains unchanged throughout the user's session. New tabs/refresh
 * will generate a new random accent.
 *
 * Each accent has:
 *   - light / dark:                 solid hex colors for borders, text, icons
 *   - gradientLight / gradientDark: rgba values for background gradient fills (~18% / ~28% opacity)
 *
 * The active accent name is stored on <header data-header-accent="..."> and
 * is NOT re-rolled during view transitions (by design).
 */

export type Accent = {
  light: string;
  dark: string;
  gradientLight: string;
  gradientDark: string;
};

export const ACCENTS: Record<string, Accent> = {
  cyan: {
    light: "#00FFFF",
    dark: "#00BFBF",
    gradientLight: "rgba(0,255,255,0.18)",
    gradientDark: "rgba(0,191,191,0.28)",
  },
  magenta: {
    light: "#FF00FF",
    dark: "#BF00BF",
    gradientLight: "rgba(255,0,255,0.18)",
    gradientDark: "rgba(191,0,191,0.28)",
  },
  yellow: {
    light: "#FFFF00",
    dark: "#BFBF00",
    gradientLight: "rgba(255,255,0,0.18)",
    gradientDark: "rgba(191,191,0,0.28)",
  },
};

/**
 * Reads the active accent name from the header element and returns the
 * corresponding Accent entry. Falls back to cyan if unset or unrecognised.
 *
 * Must be called client-side (requires DOM access).
 */
export function getHeaderAccent(): Accent {
  const name = document.querySelector("header")?.dataset.headerAccent ?? "cyan";
  return ACCENTS[name] ?? ACCENTS.cyan;
}
