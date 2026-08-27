// src/lib/storage.ts
//
// `localStorage` behind a try/catch, once. Every access has to be guarded —
// Safari private mode throws on `getItem`, not just on write — and an unguarded
// read anywhere in this module's callers would take down whatever ran it.
//
// Nothing here throws, and nothing here reports failure: a visitor with storage
// blocked gets a working site that forgets its theme/basemap choice on reload,
// which is what returning the caller's fallback does.
//
// Never used for anything the scope policy would call visitor data. This only
// ever stores a UI preference (theme, basemap id) — never a search, an address,
// or anything tied to an identity.

/** Reads a string, or `fallback` if it is absent, invalid, or unreadable. */
export function readStored<T extends string>(
  key: string,
  isValid: (value: string) => value is T,
  fallback: T,
): T;
export function readStored(key: string): string | null;
export function readStored<T extends string>(
  key: string,
  isValid?: (value: string) => value is T,
  fallback?: T,
): T | string | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback ?? null;
    if (!isValid) return stored;
    if (isValid(stored)) return stored;
  } catch {
    // ignore — falls through to the fallback below
  }
  return fallback ?? null;
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/**
 * Forgets a key. Distinct from writing an empty value: for keys whose *absence*
 * is what means something — a basemap id being unset is what lets the site
 * theme's basemap pairing apply — clearing is the only way back to that state.
 */
export function removeStored(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
