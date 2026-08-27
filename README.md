# sea

A civic map of Southeast Asia's land border crossings ("gates") — which ones
Americans are permitted to cross, and under what rules.

## What this maps

Each record is a land border crossing between two Southeast Asian countries:
its legal status, hours of operation, and rules for travelers on a U.S.
passport. It does not track or identify the people who use a crossing —
only the crossing itself, as a piece of infrastructure. See `AGENTS.md` for
the full scope rule.

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
