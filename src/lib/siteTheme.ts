// src/lib/siteTheme.ts
//
// Single source of truth for the site's light/dark chrome theme. The colours
// live in styles/global.css (:root vs .dark); this module only decides which of
// the two is active, and persists the choice.
//
// Note the split of responsibilities with mapStyles.ts: this picks the *UI
// chrome* theme, mapStyles.ts picks the *basemap*. They are paired on first load
// (see THEME_BASEMAP there) so a fresh visitor gets a coherent light or dark
// map, but a visitor who picks a specific basemap afterwards keeps it —
// switching the site theme again will not stomp that choice.

import { readStored, writeStored } from "./storage";

export type SiteTheme = "light" | "dark";

export const SITE_THEME_STORAGE_KEY = "siteTheme";

/**
 * Light, not the OS preference. The served markup carries no `dark` class, so
 * this is also what a no-JS or slow-JS visitor sees — the safer default for a
 * public-records site.
 */
export const DEFAULT_SITE_THEME: SiteTheme = "light";

export const SITE_THEME_CHANGE_EVENT = "sitethemechange";

/**
 * `<meta name="theme-color">` per theme, so mobile browser chrome matches.
 *
 * The light value is the BAND colour, not --canvas: what sits under the browser
 * chrome on a phone is this site's header band, not the map.
 *
 * DUPLICATED into the no-flash script in the layout, which has to be inline and
 * dependency-free — importing this module there would defer it past first paint,
 * which is the exact problem that script exists to solve. Keep the two in sync.
 */
const THEME_COLOR: Record<SiteTheme, string> = {
  light: "#002d5d",
  dark: "#131314",
};

export function isSiteTheme(value: unknown): value is SiteTheme {
  return value === "light" || value === "dark";
}

/** Reads the persisted theme, falling back to the default. Never throws. */
export function getStoredTheme(): SiteTheme {
  return readStored(SITE_THEME_STORAGE_KEY, isSiteTheme, DEFAULT_SITE_THEME);
}

/** The theme currently applied to the document, regardless of what is stored. */
export function getActiveTheme(): SiteTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Applies `theme` to <html> and persists it. The class toggle is what actually
 * swaps every token in global.css, so this one call restyles the whole UI.
 */
export function setTheme(theme: SiteTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");

  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", THEME_COLOR[theme]);

  writeStored(SITE_THEME_STORAGE_KEY, theme);

  document.dispatchEvent(
    new CustomEvent<{ theme: SiteTheme }>(SITE_THEME_CHANGE_EVENT, { detail: { theme } }),
  );
}

/**
 * Returns an unsubscribe function rather than void: the listener
 * `document.addEventListener` actually sees is the wrapper closure below, not
 * `handler` itself, so a caller that later tried
 * `removeEventListener(EVENT, handler)` on its own would silently remove
 * nothing — this is the only reference that matches.
 */
export function onSiteThemeChange(handler: (theme: SiteTheme) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<{ theme: SiteTheme }>).detail.theme);
  document.addEventListener(SITE_THEME_CHANGE_EVENT, listener);
  return () => document.removeEventListener(SITE_THEME_CHANGE_EVENT, listener);
}
