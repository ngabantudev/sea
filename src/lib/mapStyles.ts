// src/lib/mapStyles.ts
//
// Basemap registry — the "Map Theme" half of the theme selector.
//
// Kept identical across sister sites on purpose: same styles, same ids, same
// pairing logic, so someone who has used one of them finds the same options in
// the same place on the other.

import { getStoredTheme, type SiteTheme } from "./siteTheme";
import { readStored, removeStored, writeStored } from "./storage";

export interface MapStyleOption {
  id: string;
  label: string;
  url: string;
  /**
   * Whether this basemap's own background reads as dark. NOT the same question
   * as the site's chrome theme — a visitor can pick any basemap independently
   * of the Light/Dark toggle — so any layer whose colours are tuned against the
   * basemap (outline hexes, label halos) keys off this, not off siteTheme.ts.
   */
  dark: boolean;
}

/**
 * Self-hosted basemap archive, if this repo has one. See TILES.md.
 *
 * `||` rather than `??`, deliberately: an unset env var arrives as `undefined`,
 * but one declared-and-empty (as in a `.env` copied from `.env.example`)
 * arrives as `""`. `??` would keep that empty string and hand MapLibre a blank
 * archive URL, producing a map with no basemap and no error.
 */
export const SELF_HOSTED_TILES_URL = import.meta.env.PUBLIC_TILES_URL || "";

/**
 * Whether this repo serves its own tiles. Exported because the attribution and
 * the privacy copy both depend on the answer — a site claiming no third party
 * sees visitor traffic must not be calling a tile vendor from the browser.
 */
export const IS_SELF_HOSTED = SELF_HOSTED_TILES_URL !== "";

/**
 * Base URL packs are downloaded from — a directory of per-country .pmtiles
 * files built by scripts/tiles/build-basemap.mjs, NOT a single archive. This
 * is what src/lib/offlinePacks.ts fetches from; it is a separate concern from
 * SELF_HOSTED_TILES_URL above, which points at one streamed archive for the
 * (online, byte-range) self-hosted mode. A repo can offer offline packs
 * without ever setting PUBLIC_TILES_URL.
 */
export const PACKS_BASE_URL = import.meta.env.PUBLIC_PACKS_BASE_URL || "";

export const OFFLINE_PACKS_AVAILABLE = PACKS_BASE_URL !== "";

/**
 * Attribution for the self-hosted archive. TWO separate licence obligations,
 * not one restatement: rendering from OSM data produces a Produced Work under
 * ODbL, and planetiler emits the OpenMapTiles schema, which is CC-BY. Geofabrik
 * is credited as the extract's provenance. Unlike a vendor basemap this is not
 * configurable per deployment — there is no vendor left to swap, only the
 * data's own terms, which do not change.
 */
export const SELF_HOSTED_ATTRIBUTION =
  '© <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
  '<a href="https://www.geofabrik.de/">Geofabrik</a> extract';

/**
 * OpenFreeMap: no API key, no account, no per-request billing, and it survives
 * the maintainer walking away. A keyed vendor fails the durability test
 * outright — `flockoffmn` migrated off MapTiler after its free tier hit the
 * request/session ceiling within a normal month of traffic.
 *
 * But OpenFreeMap is still a third party the browser calls directly on every
 * pan, which means it is a live dependency AND it sees visitor traffic. It is
 * the default here because a newcomer's first `npm run dev` must not require a
 * Cloudflare account. It is not the finish line: set PUBLIC_TILES_URL and run
 * `scripts/tiles/build-basemap.mjs` to serve one static PMTiles archive from
 * your own R2 bucket instead. TILES.md has the runbook and the four things that
 * go wrong.
 *
 * If you keep this, say so where it is true: name the provider on the privacy
 * and sources pages, the way `wealldobettermn` does.
 */
export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  // Its background is #45516E — muted, but dark enough that an outline tuned
  // for the light basemaps disappears against it too.
  { id: "fiord", label: "Fiord (Muted)", url: "https://tiles.openfreemap.org/styles/fiord", dark: true },
  { id: "liberty", label: "Liberty (Google Maps)", url: "https://tiles.openfreemap.org/styles/liberty", dark: false },
  { id: "positron", label: "Light Minimal", url: "https://tiles.openfreemap.org/styles/positron", dark: false },
  { id: "dark", label: "Dark Mode", url: "https://tiles.openfreemap.org/styles/dark", dark: true },
];

/** Whether a basemap id's own background is dark. Unknown ids read as light. */
export function isMapStyleDark(id: string): boolean {
  return MAP_STYLE_OPTIONS.find((option) => option.id === id)?.dark ?? false;
}

/**
 * Basemap paired with each site theme. Switching the site theme always switches
 * the basemap to its partner here — the two are treated as one decision, so the
 * chrome and the map cannot end up mismatched. A visitor can still pick any
 * basemap afterwards; that choice sticks until the next time they change theme.
 *
 * Pick the light partner for legibility *under the chrome*, not for minimalism:
 * a muted-but-dark basemap under an off-white chrome means the light theme opens
 * onto a dark map.
 */
export const THEME_BASEMAP: Record<SiteTheme, string> = {
  light: "positron",
  dark: "dark",
};

/**
 * Set ONLY when the visitor picks a basemap by hand. Its absence is meaningful:
 * it is what lets the pairing above apply, and once it is set the pairing stops
 * overriding the choice.
 *
 * Do not also write this on a theme switch. A stored value written that way is
 * indistinguishable from a deliberate choice, which makes the pairing above
 * unchangeable in practice — every visitor who has ever clicked a theme has a
 * basemap pinned, so repointing THEME_BASEMAP does nothing for them. If a key
 * has already been polluted this way, RENAME it: that drops the ambiguous values
 * exactly once, and from there the key means only what this comment says.
 */
export const MAP_STYLE_STORAGE_KEY = "mapBasemapChoice";

function isKnownStyleId(value: string): boolean {
  return MAP_STYLE_OPTIONS.some((o) => o.id === value);
}

/** The visitor's explicit choice, or null if they have not made one. */
function getStoredMapStyleId(): string | null {
  const stored = readStored(MAP_STYLE_STORAGE_KEY);
  return stored !== null && isKnownStyleId(stored) ? stored : null;
}

export function storeMapStyleId(id: string): void {
  writeStored(MAP_STYLE_STORAGE_KEY, id);
}

/**
 * Drops a hand-picked basemap, handing control back to the theme pairing. This
 * is what a theme switch does INSTEAD of persisting the pairing it just applied:
 * the pairing is already recoverable from the stored theme, so writing it here
 * as well only makes a later change to THEME_BASEMAP unreachable.
 */
export function clearStoredMapStyleId(): void {
  removeStored(MAP_STYLE_STORAGE_KEY);
}

/** The basemap the map should actually show right now. */
export function getInitialMapStyle(): MapStyleOption {
  // One `??`, not two. `getStoredTheme()` is validated to return "light" or
  // "dark" and THEME_BASEMAP has both keys, so a second fallback to
  // THEME_BASEMAP[DEFAULT_SITE_THEME] can never run — and a branch that reads
  // as reachable is worse than no branch, because the next person preserves it
  // through a refactor that would otherwise have simplified.
  //
  // The remaining `??` IS reachable: THEME_BASEMAP is hand-edited, so it can
  // name an id that no longer exists in MAP_STYLE_OPTIONS.
  const id = getStoredMapStyleId() ?? THEME_BASEMAP[getStoredTheme()];
  return MAP_STYLE_OPTIONS.find((o) => o.id === id) ?? MAP_STYLE_OPTIONS[0];
}

export const MAP_STYLE_CHANGE_EVENT = "mapstylechange";

/** See onSiteThemeChange in siteTheme.ts for why this returns an unsubscribe. */
export function onMapStyleChange(handler: (option: MapStyleOption) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<MapStyleOption>).detail);
  document.addEventListener(MAP_STYLE_CHANGE_EVENT, listener);
  return () => document.removeEventListener(MAP_STYLE_CHANGE_EVENT, listener);
}
