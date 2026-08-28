# sea

A free civic map of Southeast Asia for American travelers: which land
border crossings ("gates") you can use, and where to find free or
low-cost lodging.

## What this maps

- **Gates** — land border crossings between Southeast Asian countries:
  legal status, hours, and rules for a traveler on a U.S. passport.
- **Lodging** — free-bed hostels, hospitality institutions (monasteries,
  temples that host travelers), and volunteer-stay/work-exchange programs.

Every record describes a place run as an institution — never a person.
**Private-individual hosting (e.g. Couchsurfing) is deliberately out of
scope** and will not be added; see `AGENTS.md` for why. See `AGENTS.md` for
the full scope rule.

## Works fully offline

The map itself — not just the app — is meant to work with no connection,
the way OsmAnd or Organic Maps do. Download a country's map from the
layers button on the map (bottom right) and it's stored on your device;
from then on that country loads with zero network requests. The site is
also installable as an app and opens offline after a first visit. See
`TILES.md` and `AGENTS.md` for how this is built.

## Data sources

TODO — not yet filled in. Sources should be each country's immigration or
border-management agency, published bilateral border agreements, and
official U.S. Department of State travel advisories. See `LICENSE-DATA.md`
for the source register, and `CONTRIBUTING.md` / the `sourcing` standard for
what counts as citable.

## Rebuilding the data

TODO — no data pipeline exists yet. Once one does, the single command that
rebuilds all derived data from upstream sources goes here.

## Running the site

```bash
npm install
npm run dev
```

## License

Code is licensed AGPL-3.0 (`LICENSE`). Data published by this project is
licensed CC BY-SA 4.0; upstream data retains its own licenses, recorded in
`LICENSE-DATA.md`. See `CONTRIBUTING.md` for alternative licensing.
