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

Not yet decided in detail — this section needs a real interview with the maintainer before code is written. Known so far:

- Web UI: yes, a map-first site using the shared Astro chrome from the `interface` skill (copied into this repo, then diverged).
- Two data layers, filterable independently: `gates` and `lodging`. `lodging` carries a `type` field (`hostel` | `institution` | `volunteer-stay`) driving the UI's filter dropdown.
- Data scope: one row per border crossing or per lodging site, per `scope` skill rules — the place is the system, not the guards, hosts, or travelers at it.
- Primary sources for crossing status/rules: each country's immigration/border agency, bilateral treaties, and official travel advisories. Not travel blogs or forums.
- Primary sources for lodging: the institution's own listing/site, or the hosting program's own directory (e.g. a monastery's published visitor policy, a work-exchange platform's institution listing). Not user-submitted reviews as a data field.

## Commands

Not yet set up. To be filled in once the Astro app is scaffolded (`npm install && npm run dev`) and a data-rebuild command exists.
