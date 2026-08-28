<!-- civic-standards:begin — shared across all civic repos. Edit in the plugin, not here. -->

## Shared civic standards

**Transparency for systems; privacy for people.** Every record describes an institution, a piece of infrastructure, a contract, an office, or a historical policy. Nothing describes, names, tracks, or locates a private individual — not detainees, not residents, not officers, not agents. When in doubt, leave it out.

**Primary sources only.** Statutory text, court filings, agency records, and official datasets are the sources of data fields. Journalism is citable for events, never as a data field. Advocacy sources and forums are never a data source. Never fabricate: leave the field `null`, state `"No source found"`, and log the gap in `knownGaps`.

**Reproducible.** A stranger with a clone and no credentials can rebuild all derived data from upstream with one documented command.

**No third-party runtime assets.** No external analytics, fonts, embeds, or cloud geocoding. People researching surveillance infrastructure should not be surveilled while doing it.

**Open by construction.** Code license in `LICENSE`, upstream data licenses in `LICENSE-DATA.md`, contributor path in `CONTRIBUTING.md`, correction path stated and honored.

Full detail lives in the `civic-standards` plugin skills (`scope`, `sourcing`, `openness`), which load automatically. Do not duplicate them here.

<!-- civic-standards:end -->

This repo imports the cross-project durability standard: @DURABILITY.md — no exceptions recorded yet.

---

## What this repo is

**sea** is a free civic map of Southeast Asia for American travelers, with two layers:

1. **Gates** — land border crossings, their legal status, hours, and rules for a U.S. passport holder.
2. **Lodging** — free or low-cost places to stay: hostels, hospitality institutions (monasteries, temples that host travelers), and volunteer-stay programs.

Both layers map an institution or a piece of infrastructure, never a person. See the scope note below — it is a hard boundary, not a style preference.

### Scope boundary: no individual hosts

**Couchsurfing-style private hosting is explicitly out of scope and must never be added, in any form** — not a toggle, not a hidden field, not "unlisted." A private host's home tied to their name and address is exactly the individual-level data the `scope` skill forbids. This was raised and declined on 2026-08-27; if it comes up again, point back here rather than re-litigating it.

Everything else in the lodging layer is fine because it names a *place run as an institution*, not a private person's home:
- Free-bed hostels (commercial or nonprofit)
- Hospitality institutions — monasteries, temples, and similar that host travelers
- Volunteer-stay / work-exchange programs (the program and its listed site, not an individual host)

## Architecture

- Web UI: a map-first site using the shared Astro chrome from the `interface` skill (copied into this repo, then diverged). Default camera is Southeast Asia (`src/data/seaCountries.mjs` → `SEA_DEFAULT_VIEW`), not the template's original Minnesota view.
- Two data layers, filterable independently: `gates` and `lodging`. `lodging` carries a `type` field (`hostel` | `institution` | `volunteer-stay`) driving the UI's filter dropdown. **Neither layer has real data yet** — the map, storage, and offline pipeline below are built; the gate/lodging records themselves still need sourcing.
- Data scope: one row per border crossing or per lodging site, per `scope` skill rules — the place is the system, not the guards, hosts, or travelers at it.
- Primary sources for crossing status/rules: each country's immigration/border agency, bilateral treaties, and official travel advisories. Not travel blogs or forums.
- Primary sources for lodging: the institution's own listing/site, or the hosting program's own directory (e.g. a monastery's published visitor policy, a work-exchange platform's institution listing). Not user-submitted reviews as a data field.

### Fully offline, on-device — the OsmAnd/Organic Maps model

This is not a "self-hosted tiles" site, it's an **offline-first** one. The difference: self-hosted PMTiles still makes a byte-range network request on every pan; this repo's offline mode makes none, ever, once a pack is on the device.

- **One basemap archive per Southeast Asian country** (`src/data/seaCountries.mjs` → `SEA_COUNTRIES`), built by `scripts/tiles/build-basemap.mjs` and uploaded to a public bucket. Per-country, not one region-wide file, because a street-level SEA-wide archive is multiple GB — a bad ask on mobile data and phone storage. Decided with the maintainer 2026-08-27.
- **On-device storage is the Origin Private File System (OPFS)**, not IndexedDB or a service-worker cache — see `src/lib/offlinePacks.ts` for why. A downloaded pack survives restarts and is read with zero network calls via pmtiles' own `FileSource` (`src/lib/offlineMap.ts`).
- **The app shell is a PWA** (`public/manifest.webmanifest`, `public/sw.js`, registered in `Layout.astro`) so the site itself — not just the map data — opens with no connection after a first visit. The service worker deliberately never caches tiles/packs; that stays an explicit, visitor-initiated download, never something that happens behind their back (DURABILITY.md's Goodwill pillar).
- Priority order MapView actually uses: **downloaded offline pack → self-hosted streamed archive (`PUBLIC_TILES_URL`) → OpenFreeMap online**. The first one that exists wins; the offline pack always outranks the others when present.
- `PUBLIC_PACKS_BASE_URL` (new env var) points the browser's download picker at wherever `build-basemap.mjs --upload` published the per-country files. Separate from `PUBLIC_TILES_URL`, which is the older single-archive streaming mode — a repo can offer offline packs without setting that at all.

## Commands

```bash
npm install && npm run dev     # local dev
npm run build && npm run check # build + typecheck
node scripts/tiles/build-basemap.mjs --only=thailand --upload   # build/publish one country's offline pack
```

No data-rebuild command yet for the `gates`/`lodging` datasets themselves — those don't exist as data yet, only as a schema shape (see Architecture above).
