// src/lib/offlineMap.ts
//
// Wires a downloaded pack (offlinePacks.ts) into MapLibre. This is the piece
// that makes "downloaded" mean "usable with the network off": a stored File
// becomes a pmtiles FileSource, which reads bytes with Blob.slice() —
// File.slice() never touches fetch(), so this path makes zero network
// requests once the map is constructed.
//
// Kept separate from offlinePacks.ts on purpose: that module only knows about
// bytes on disk and has no MapLibre/pmtiles-protocol dependency, so it stays
// testable and reusable if this project ever renders a pack outside MapLibre
// (a coverage-check CLI, say).

import { FileSource, PMTiles, Protocol } from "pmtiles";
import { buildSelfHostedStyle } from "./selfHostedStyle";
import { getStoredPack, listStoredPackIds } from "./offlinePacks";
import { readStored, writeStored } from "./storage";

export const ACTIVE_PACK_STORAGE_KEY = "activeOfflinePackId";
export const OFFLINE_PACK_CHANGE_EVENT = "offlinepackchange";

/** One Protocol instance for the page — MapLibre's `pmtiles://` handler reads
 * from whatever archives have been `.add()`-ed to it, so every offline style
 * this module builds has to register onto the same instance MapView passed
 * to `maplibregl.addProtocol`. */
let protocol: Protocol | null = null;

export function setOfflineProtocol(p: Protocol): void {
  protocol = p;
}

export function getActiveOfflinePackId(): string | null {
  return readStored(ACTIVE_PACK_STORAGE_KEY);
}

export function setActiveOfflinePackId(id: string | null): void {
  if (id) writeStored(ACTIVE_PACK_STORAGE_KEY, id);
  document.dispatchEvent(new CustomEvent(OFFLINE_PACK_CHANGE_EVENT, { detail: { id } }));
}

/**
 * Builds a style over whichever pack is active, or null if none is
 * downloaded yet — callers fall back to the online basemap in that case.
 * Picks the stored choice if it's actually on disk; otherwise the first
 * pack that IS on disk, so deleting the active pack doesn't strand the map
 * on a style pointing at a file that no longer exists.
 */
export async function getActiveOfflineStyle(
  theme: "light" | "dark",
): Promise<{ style: ReturnType<typeof buildSelfHostedStyle>; countryId: string } | null> {
  if (!protocol) return null;

  const stored = await listStoredPackIds();
  if (stored.length === 0) return null;

  const preferred = getActiveOfflinePackId();
  const countryId = preferred && stored.includes(preferred) ? preferred : stored[0];

  const file = await getStoredPack(countryId);
  if (!file) return null;

  const pmtiles = new PMTiles(new FileSource(file));
  protocol.add(pmtiles);

  return { style: buildSelfHostedStyle(file.name, theme), countryId };
}
