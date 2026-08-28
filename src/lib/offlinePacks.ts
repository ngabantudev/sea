// src/lib/offlinePacks.ts
//
// On-device storage for basemap packs — the part that makes this a real
// offline map instead of a self-hosted tile server. A pack is one country's
// PMTiles archive (src/data/seaCountries.mjs). Once downloaded, MapView reads
// it straight off disk through pmtiles' own FileSource — no network request,
// same as OsmAnd or Organic Maps reading a region file it already has.
//
// Storage is the Origin Private File System (OPFS): per-origin, persists
// across restarts and browser closes, and holds large files without the
// UTF-16 string-copy tax IndexedDB pays moving a few hundred MB through
// structured clone. Support is Chromium + Safari 16.4+ + Firefox 111+ — see
// isOfflineStorageSupported(). Where it's missing, the offline picker simply
// doesn't offer downloads; the site still works online exactly as before.
//
// NOT durable storage by default: like any origin storage, the browser CAN
// evict this under disk pressure unless the visitor has granted
// `navigator.storage.persist()`. requestPersistence() asks; a pack surviving
// a phone running low on space is not guaranteed either way, so re-download
// is always the recovery path, never data loss the visitor has to fear
// (nothing here is user-authored — it's a cache of public map data).

import { SEA_COUNTRIES, packFileName } from "~/data/seaCountries.mjs";

export interface PackProgress {
  countryId: string;
  receivedBytes: number;
  totalBytes: number | null;
}

const OFFLINE_DIR = "sea-offline-packs";

export function isOfflineStorageSupported(): boolean {
  return typeof navigator !== "undefined" && "storage" in navigator && "getDirectory" in navigator.storage;
}

/** Best-effort: ask the browser not to evict this origin's storage under
 * pressure. Many browsers grant this silently based on site-engagement
 * heuristics rather than a prompt — this just registers the request. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage.persist?.()) ?? false;
  } catch {
    return false;
  }
}

async function getPacksDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(OFFLINE_DIR, { create: true });
}

function packUrl(baseUrl: string, countryId: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${packFileName(countryId)}`;
}

/** Which country packs currently have a file on disk. */
export async function listStoredPackIds(): Promise<string[]> {
  if (!isOfflineStorageSupported()) return [];
  const dir = await getPacksDir();
  const ids: string[] = [];
  for await (const [name] of dir.entries()) {
    const match = SEA_COUNTRIES.find((c) => packFileName(c.id) === name);
    if (match) ids.push(match.id);
  }
  return ids;
}

/** The stored archive as a browser File, or null if it hasn't been
 * downloaded. This File is what gets handed to pmtiles' FileSource. */
export async function getStoredPack(countryId: string): Promise<File | null> {
  if (!isOfflineStorageSupported()) return null;
  try {
    const dir = await getPacksDir();
    const handle = await dir.getFileHandle(packFileName(countryId));
    return await handle.getFile();
  } catch {
    return null; // not downloaded
  }
}

export async function deleteStoredPack(countryId: string): Promise<void> {
  if (!isOfflineStorageSupported()) return;
  const dir = await getPacksDir();
  await dir.removeEntry(packFileName(countryId)).catch(() => {});
}

/**
 * Downloads one country's archive and writes it to OPFS as it streams in —
 * never holding the whole multi-hundred-MB file in memory at once. Aborting
 * `signal` stops the fetch; the partial write is discarded (a `.part` name)
 * rather than left as a truncated pack that would fail silently offline.
 */
export async function downloadPack(
  countryId: string,
  baseUrl: string,
  onProgress?: (progress: PackProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!isOfflineStorageSupported()) {
    throw new Error("Offline storage is not available in this browser.");
  }

  const res = await fetch(packUrl(baseUrl, countryId), { signal });
  if (!res.ok || !res.body) {
    throw new Error(`Could not download ${countryId} pack: HTTP ${res.status}`);
  }
  const totalBytes = Number(res.headers.get("content-length")) || null;

  const dir = await getPacksDir();
  const partName = `${packFileName(countryId)}.part`;
  const partHandle = await dir.getFileHandle(partName, { create: true });
  const writable = await partHandle.createWritable();

  let receivedBytes = 0;
  try {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      receivedBytes += value.byteLength;
      onProgress?.({ countryId, receivedBytes, totalBytes });
    }
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    await dir.removeEntry(partName).catch(() => {});
    throw error;
  }

  // Atomic-ish swap: only rename to the real filename once the whole archive
  // is on disk, so a crash or a killed tab mid-download never leaves a
  // truncated file under the name MapView will try to read.
  const finalHandle = await dir.getFileHandle(packFileName(countryId), { create: true });
  const finalWritable = await finalHandle.createWritable();
  const partFile = await (await dir.getFileHandle(partName)).getFile();
  await finalWritable.write(partFile);
  await finalWritable.close();
  await dir.removeEntry(partName).catch(() => {});
}

/** Total bytes across every pack currently on disk, for a "storage used"
 * readout in the offline packs panel. */
export async function storedPacksTotalBytes(): Promise<number> {
  const ids = await listStoredPackIds();
  let total = 0;
  for (const id of ids) {
    const file = await getStoredPack(id);
    if (file) total += file.size;
  }
  return total;
}
