// src/data/seaCountries.mjs
//
// The one registry of "which Southeast Asian country is this," shared by two
// things that would otherwise drift: scripts/tiles/build-basemap.mjs (which
// area to hand Geofabrik) and the browser-side offline pack picker (which
// file to download and what to call it). Plain JS, not .ts — the build
// script is a bare Node process with no bundler in front of it, and this file
// has to import cleanly into both that and the Astro app without a build
// step either way.
//
// `geofabrikArea` is the exact sub-region slug Geofabrik publishes under
// https://download.geofabrik.de/asia.html — planetiler's `--area=` flag
// resolves it to that extract. Verified against that page 2026-08-27; if a
// build starts failing to resolve an area, check there first before assuming
// this file is wrong.
export const SEA_COUNTRIES = [
  { id: "thailand", label: "Thailand", geofabrikArea: "asia/thailand" },
  { id: "vietnam", label: "Vietnam", geofabrikArea: "asia/vietnam" },
  { id: "cambodia", label: "Cambodia", geofabrikArea: "asia/cambodia" },
  { id: "laos", label: "Laos", geofabrikArea: "asia/laos" },
  { id: "myanmar", label: "Myanmar", geofabrikArea: "asia/myanmar" },
  {
    id: "malaysia-singapore-brunei",
    label: "Malaysia, Singapore & Brunei",
    geofabrikArea: "asia/malaysia-singapore-brunei",
  },
  { id: "indonesia", label: "Indonesia", geofabrikArea: "asia/indonesia" },
  { id: "philippines", label: "Philippines", geofabrikArea: "asia/philippines" },
  // Geofabrik ships this as its own small extract even though the Indonesia
  // file's description also lists East Timor — pulling the whole Indonesia
  // archive just for Timor-Leste would defeat the point of per-country packs.
  { id: "timor-leste", label: "Timor-Leste", geofabrikArea: "asia/east-timor" },
];

/** @param {string} id */
export function findSeaCountry(id) {
  return SEA_COUNTRIES.find((c) => c.id === id) ?? null;
}

/** Filename a pack is stored/served under — shared so the build script's
 * upload path and the browser's download path never disagree on a name. */
export function packFileName(countryId) {
  return `sea-${countryId}.pmtiles`;
}

// Southeast Asia's own rough bounding view — mainland (Myanmar) to maritime
// (eastern Indonesia). Used as the map's default camera instead of any one
// country, since a first-time visitor hasn't picked a pack yet.
export const SEA_DEFAULT_VIEW = { center: [108, 6], zoom: 4.1 };
