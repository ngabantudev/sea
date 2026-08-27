// src/lib/selfHostedStyle.ts
//
// A minimal MapLibre style spec over a self-hosted PMTiles archive built by
// scripts/tiles/build-basemap.mjs. Only used when PUBLIC_TILES_URL is set —
// see ~/lib/mapStyles.ts and TILES.md.
//
// SCOPE, stated so nobody mistakes this for a finished basemap: this is the
// "degrade to a plain background with boundaries drawn" floor, not a cartographic
// design. It draws land, water, roads by class, and place labels — enough to
// locate a record by, in both themes, with no vendor. A project whose map IS the
// product should write a real style; `flockoffmn`'s src/lib/mapStyle.ts is ~440
// lines of hand-tuned paint and is the reference for what that looks like.
//
// Layer names below ('water', 'transportation', 'place', 'boundary') are the
// OpenMapTiles schema, which is what planetiler emits. That schema is CC-BY and
// carries its own attribution obligation separate from OSM's ODbL — both are in
// SELF_HOSTED_ATTRIBUTION.

import type { StyleSpecification } from "maplibre-gl";
import { SELF_HOSTED_ATTRIBUTION } from "./mapStyles";

/** Ink values per theme. Deliberately literal, not the CSS tokens: MapLibre
 *  paint properties are read by WebGL, which cannot resolve `var(--ink)`. Keep
 *  these in step with global.css by hand — there is no way to share them. */
const PALETTE = {
  light: {
    land: "#f0f0f0",
    water: "#c9d9e8",
    roadMajor: "#ffffff",
    roadMinor: "#f7f7f7",
    roadCasing: "#d9d9d9",
    boundary: "#b0b0b0",
    label: "#333333",
    labelHalo: "#ffffff",
  },
  dark: {
    land: "#131314",
    water: "#0f1c26",
    roadMajor: "#2a2a2e",
    roadMinor: "#1e1e21",
    roadCasing: "#000000",
    boundary: "#3a3a3f",
    label: "#a3a3a3",
    labelHalo: "#0a0a0a",
  },
} as const;

export function buildSelfHostedStyle(
  tilesUrl: string,
  theme: "light" | "dark",
): StyleSpecification {
  const c = PALETTE[theme];

  return {
    version: 8,
    // No glyphs URL: label layers below use no custom font stack, so MapLibre
    // falls back to its own. A project that wants real typography self-hosts a
    // glyph directory — another static asset in the same bucket — rather than
    // pointing at a vendor's font server, which would reintroduce exactly the
    // third-party call this file exists to remove.
    glyphs: undefined,
    sources: {
      basemap: {
        type: "vector",
        // `pmtiles://` is resolved by the protocol registered in MapView.
        url: `pmtiles://${tilesUrl}`,
        attribution: SELF_HOSTED_ATTRIBUTION,
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": c.land } },
      {
        id: "water",
        type: "fill",
        source: "basemap",
        "source-layer": "water",
        paint: { "fill-color": c.water },
      },
      {
        id: "road-casing",
        type: "line",
        source: "basemap",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
        paint: {
          "fill-color": c.roadCasing,
          "line-color": c.roadCasing,
          // Interpolated rather than fixed: a constant width reads as a spider
          // web at z5 and as a hairline at z14.
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.8, 14, 6],
        } as never,
      },
      {
        id: "road-minor",
        type: "line",
        source: "basemap",
        "source-layer": "transportation",
        minzoom: 11,
        filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary", "minor"]]],
        paint: {
          "line-color": c.roadMinor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.4, 16, 3],
        },
      },
      {
        id: "road-major",
        type: "line",
        source: "basemap",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
        paint: {
          "line-color": c.roadMajor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.4, 14, 4],
        },
      },
      {
        id: "boundary",
        type: "line",
        source: "basemap",
        "source-layer": "boundary",
        filter: ["<=", ["get", "admin_level"], 6],
        paint: { "line-color": c.boundary, "line-width": 0.8, "line-dasharray": [2, 2] },
      },
      {
        id: "place-label",
        type: "symbol",
        source: "basemap",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10, 12, 14],
        },
        paint: { "text-color": c.label, "text-halo-color": c.labelHalo, "text-halo-width": 1.2 },
      },
    ],
  } as StyleSpecification;
}
