# Palette provenance

Fill this in **before** writing a hex into `global.css`. A brand color is a claim and it carries a citation, same as any data field. Then copy the reasoning into the comments in `global.css` at the point of use — this file is the worksheet, the stylesheet is where the reasoning has to survive.

## The two sources

The house style splits the palette in two, and the split is load-bearing. One source supplies the **workspace** (the surfaces a reader works in for an hour), the other supplies the **identity band** (the strip that says whose site this is). Using one source for both produces either a workspace too saturated to read or a band with no identity.

### Source A — the workspace

The chrome: canvas, panels, ink ramp, hairlines, hover, link color.

| | |
|---|---|
| Source | *e.g. State of Minnesota web portal, `mn.gov` `core.css`* |
| URL | |
| Date checked | |
| Why this source | *Whose authority the site is holding to account, or whose civic surface a reader already recognizes.* |

Values taken, each with the role it plays upstream:

| Hex | Upstream role | Our token |
|---|---|---|
| | | `--panel` |
| | | `--hover` |
| | | `--panel-3` |
| | | `--hair` |
| | | `--hair-strong` |
| | | `--ink-2` |
| | | `--ink-3` |
| | | `--accent` |
| | | `--positive` |
| | | `.band-sub` field |

### Source B — the identity band

`.band`: the masthead and panel headers.

| | |
|---|---|
| Source | *e.g. Minnesota state flag, State Emblems Redesign Commission final report, 2024-01-01* |
| URL | |
| Date checked | |
| Published values | *Web color, CMYK and Pantone where the source gives them.* |

| Hex | Published name | Our token |
|---|---|---|
| | | `--panel` (the field) |
| | | `--accent` |
| | | `--ink` |

## Derived values

A source with three colors will not supply every step the chrome needs — a row hover, a recessed well, a muted ink ramp. **Derive each from the source's own values and record the derivation.** Never invent a fourth color.

| Token | Derivation | Result |
|---|---|---|
| `--hover` (in band) | *e.g. accent at 16% over the field* | |
| `--well` (in band) | *e.g. the field darkened* | |
| `--ink-2` … `--ink-4` (in band) | *e.g. the light value stepped down in opacity — not a second family of hues* | |

Why an opacity ramp rather than a second hue family: a source with exactly one light accent has that accent spoken for as `--accent`, so a separate cool ramp reads as a near-miss of it. A neutral ramp is what lets the accent register as emphasis rather than as one more shade of the same wash.

## Contrast ledger

Every pairing that ships, measured. Record the number, not "looks fine."

| Foreground | Background | Ratio | Floor | Pass |
|---|---|---|---|---|
| `--ink` | `--panel` | | 4.5:1 (AA) | |
| `--ink-2` | `--panel` | | 4.5:1 | |
| `--ink-3` | `--panel` | | 4.5:1 | |
| `--ink-4` | `--panel` | | 4.5:1 | |
| `--ink-4` | `--panel-3` | | 4.5:1 | |
| `--ink-4` | `--hover` | | 4.5:1 | |
| `--accent` | `--panel` | | 4.5:1 | |
| `--accent` | `--hover` | | 4.5:1 | |
| `--on-accent` | `--accent` | | 4.5:1 | |
| `--hover` | `--panel-2` | | 3:1 (1.4.11) | |
| `--hover` | `--panel-3` | | 3:1 | |

Repeat the whole table for `.band`, `.band-sub`, and `.dark`.

Two things this table catches that eyeballing does not:

- **`--ink-4` at 9–10px.** The micro-label scale is the house signature, and the quietest ink in it is the tightest pairing on the site. If the upstream source's own muted gray lands under 4.5:1 on your panel — mn.gov's `#767676` measures 4.1:1 on `#f2f2f2` — step it darker and write down why, or the next person "fixes" it back to match the source.
- **A hover fill against *every* surface it can land on**, not whichever one looks fine in isolation. A hover tuned against a white row is invisible on a recessed row one shade away from it.

## Translucent values

Anything expressed as `rgba` composites over whatever it lands on. Measure it against each surface it can appear over, and flatten it to a hex where it is a **replacement** background on an element that floats over the map — a translucent hover there does not tint the element, it punches a hole through it to the basemap.

## Not in this file

Status and data hexes — layer identity, project status, vote outcomes. Those encode **meaning** and must stay stable across themes, so they live in their own registry module and are never tokenized. They still need a contrast check and a color-vision-deficiency check, and they still need a second signal: color is never the only one.
