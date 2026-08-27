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

**sea** is a civic map of Southeast Asia's land border crossings ("gates"), showing which ones Americans are permitted to cross. It maps the crossing itself — its legal status, hours, and permitted-traveler rules — never the people who use it.

## Architecture

Not yet decided in detail — this section needs a real interview with the maintainer before code is written. Known so far:

- Web UI: yes, a map-first site using the shared Astro chrome from the `interface` skill (copied into this repo, then diverged).
- Data scope: one row per border crossing (gate), per `scope` skill rules — the gate is the system, not the guards or travelers at it.
- Primary sources for crossing status/rules: each country's immigration/border agency, bilateral treaties, and official travel advisories. Not travel blogs or forums.

## Commands

Not yet set up. To be filled in once the Astro app is scaffolded (`npm install && npm run dev`) and a data-rebuild command exists.
