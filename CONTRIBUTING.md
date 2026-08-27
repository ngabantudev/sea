# Contributing

Thanks for helping. This is a public-interest transparency project and
outside eyes make it more accurate.

## Setup

```bash
npm install
npm run data     # rebuild all data from upstream; no API keys required
npm run dev
npm run check    # must stay at 0 errors
```

If setup took more than those steps, that is a bug — please open an issue.

## The scope boundary

**Transparency for systems; privacy for people.**

This project maps institutions, infrastructure, contracts, offices, and
policy. It does not name, track, or locate private individuals — including
people subject to the systems mapped here, and including people who operate
them. Contributions that add individual-level data will be declined
regardless of how the data was obtained or how public it already is.

Aggregates are fine unless the cell count is small enough to identify one
person.

## Proposing a new data layer

Open an issue using the **new source** template. Include the primary source
URL, the publisher, the license, and what the data describes. Sources are
accepted in this order of preference:

1. Statutory text, court filings, agency records, FOIA responses
2. Official datasets from the originating agency
3. Republication of the above, when the original is unreachable

Journalism can establish that something happened; it is not the source of a
data field. Advocacy sources and forums are not data sources.

## Reporting a bad record

Open an issue using the **data correction** template. Include the record,
what is wrong, and a primary source for the correct value if you have one.

Records shown to be factually wrong get corrected. Records that are accurate
but objected to are annotated, not removed — deleting them would destroy the
audit trail that lets anyone verify the correction.

## Pull requests

- Keep `npm run check` at 0 errors.
- Every new field needs a cited primary source and a `LICENSE-DATA.md` entry.
- Never fill an unknown with a plausible guess. `null` plus a `knownGaps`
  entry is always the better contribution.
