# Base map tiles — the runbook

Extracted from `flockoffmn` (self-hosted basemap) and `mndatacenter` (self-hosted overlays). Both arrived here after a vendor failure or a caching bug that shipped to production. Read this before touching a tile URL.

**This repo goes one step further than either of those: fully offline, on-device packs**, one per Southeast Asian country, storable on the visitor's own device and read with zero network calls once downloaded — see the "Offline packs" section below and `AGENTS.md`. Everything below about self-hosted PMTiles still applies; it's the *streaming* tier this repo falls back to when no pack is downloaded, not the primary mode.

## The decision

A civic map has two tile problems, and they are different:

| | Basemap | Overlay layers |
|---|---|---|
| What | Roads, water, place names — the substrate | PAD-US, boundaries, service territories — your data |
| Volume | Every visitor, every pan | Only when a layer is toggled on |
| Default here | OpenFreeMap (no key, no account, no billing) | Self-hosted PMTiles in R2 |
| Durable end state | Self-hosted PMTiles in R2 | Same |

**The template ships OpenFreeMap for the basemap so `npm run dev` works with zero configuration** — a newcomer's first run must not require a Cloudflare account (DURABILITY.md, Pillar 2). That is a deliberate, documented tradeoff, not the finish line.

**Migrate to self-hosted when any of these is true:** you are putting a custom domain on the site, the map is your primary interface, or you are about to write a privacy claim that says no third party sees visitor traffic. `flockoffmn` migrated after MapTiler's free tier "hit its request/session ceiling within a normal month of traffic" — every visitor's browser was calling the vendor directly with nothing caching in front of it.

## What self-hosting actually is

One static `.pmtiles` file in a public R2 bucket. **No tile server and no Worker** — PMTiles is a range-request format, so the browser asks for byte ranges of a single file and R2 serves them directly.

A statewide archive at maxzoom 14 is ~150–350 MB and stays inside R2's free tier. A visitor does not download it: a measured session at statewide zoom with two layers on made 13 requests, all `Range`, none the whole file.

```bash
node scripts/tiles/build-basemap.mjs                             # build every SEA country's pack
node scripts/tiles/build-basemap.mjs --upload                    # build + publish all
node scripts/tiles/build-basemap.mjs --only=thailand,laos --upload
```

## Offline packs (the primary mode for this repo)

One `.pmtiles` file per country in `src/data/seaCountries.mjs`, same build tool, same bucket — the only difference is the browser's *own* download, not a byte-range stream. `src/lib/offlinePacks.ts` fetches a country's archive fully, writes it into the Origin Private File System, and `src/lib/offlineMap.ts` hands the stored `File` to pmtiles' `FileSource` so MapView reads it with `File.slice()`, never `fetch()`. Set `PUBLIC_PACKS_BASE_URL` to the bucket's public base URL (not a specific file — the picker appends `sea-<country>.pmtiles` itself) to turn this on.

This is a different tier from the streaming self-hosted mode below: a pack, once downloaded, works with the device in airplane mode. A streamed archive still makes range requests on every pan — it just doesn't call a vendor to do it.

Requires Java 17+ on PATH (planetiler is a Java program) and an authenticated `npx wrangler`. Rebuild cadence is **manual and ad hoc** — roughly annually, or when the map visibly drifts. An automated write path into a production bucket is another unattended thing that can silently overwrite something, for a benefit a road network that changes this slowly does not need.

The script downloads a regional **data** extract from Geofabrik and renders tiles locally. It does **not** scrape `tile.openstreetmap.org` — OSM's tile usage policy explicitly asks apps not to bulk-download from it.

## The four things that go wrong

**1. `r2.dev` is not a production host.** Cloudflare's own docs call it rate-limited and "intended for non-production traffic," and it gets none of the caching or WAF features a custom domain does. Attach a custom domain (`tiles.yourproject.org`) to the bucket. Keep the `r2.dev` host enabled so reverting is a one-line change.

**2. A custom domain alone does not give you edge caching.** `.pmtiles` is not in Cloudflare's default-cacheable extension list, so `cf-cache-status` reads `DYNAMIC` and every range request still reaches R2. You need a zone **Cache Rule** — "Cache Everything" for `tiles.yourproject.org/*`.

> This has to be added **from the dashboard**, not `wrangler`: creating a Cache Rule needs a zone-write API scope the deploy token does not carry. Verify with `cf-cache-status: HIT` on a repeat range request, and check that distinct byte ranges cache independently rather than colliding under one URL.

`mndatacenter` has this step still outstanding and says so in `mapLayers.ts`; `flockoffmn` confirmed it live. Until the rule exists, the custom domain buys HTTP/2 and a stable name, not fewer origin hits.

**3. `Cache-Control` is object metadata, and every re-upload drops it.** R2 has no bucket-level default. Pass the header on every `put`:

```bash
npx wrangler r2 object put <bucket>/<file>.pmtiles \
  --file=<path> \
  --content-type=application/octet-stream \
  --cache-control="public, max-age=3600, stale-while-revalidate=86400" \
  --remote
```

`--remote` is not optional: wrangler's `r2` commands default to the local simulator and will report success while changing nothing in production.

Prefer a moderate `max-age` over `immutable`. These filenames are stable across re-uploads, so `immutable` would hide a re-tiled archive from returning visitors for as long as it was set. The bucket sends an `ETag`, so after expiry the browser revalidates and gets a cheap 304.

For a repo with several overlay archives, make restoring the header a script rather than a remembered checklist — `mndatacenter`'s `scripts/set-tile-cache-headers.ts` is the reference: idempotent, one HEAD per layer, verifies the ETag is unchanged after re-upload so a truncated archive can't ship silently.

**4. Do not proxy tiles through a Worker.** The obvious fix for missing cache headers is a Worker in front of the bucket. Don't. It turns every range request into a Worker invocation on a plan whose request count binds long before bandwidth does — it trades a caching problem for a quota problem, and the quota one is worse. Fix it on the bucket.

## Attribution is a licence condition, not a courtesy

Rendering from OSM data produces a Produced Work under ODbL, and planetiler emits the OpenMapTiles schema, which is CC-BY. **Two separate obligations:**

```
© OpenMapTiles © OpenStreetMap contributors, Geofabrik extract
```

Credit the extract's provenance too. Attribution belongs in the UI where the map is, not only in `LICENSE-DATA.md` — MapLibre's compact `AttributionControl` is the standard answer, and it lists only sources currently on the map, so each overlay's credit appears exactly when that layer is switched on.

## Bindings: don't

The tile bucket is **public and unbound**. The Worker or Pages project never reads from it — the browser talks to the bucket's public URL directly. Adding a real binding means adding another place data could accumulate, which is the thing a privacy claim on `/about` is asserting doesn't exist. If you ever need one, revisit those claims first.

Keep `.pmtiles` out of git, or behind LFS if an archive genuinely must be versioned:

```
*.pmtiles filter=lfs diff=lfs merge=lfs -text
```

## Failure posture

The map must degrade to a plain background with boundaries drawn if the tile host is unreachable. The basemap is context, not content — the record list beside the canvas is the primary interface, and it does not depend on tiles at all.

If server-side logging is off for privacy reasons, a broken tile host surfaces as degraded UI rather than a log line. Build the failure to be visible.
