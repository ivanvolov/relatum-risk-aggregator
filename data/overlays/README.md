# Coverage overlays

**The single file a human edits per feed.** One YAML per adapter at `data/overlays/<feedId>.yaml`. The build pipeline applies this overlay on top of the adapter's machine-emitted snapshot, so the merged result drives the UI, COVERAGE.md, and per-protocol JSONs.

## Why this exists

Adapters know how to read their source verbatim. They emit `covered: true/false` per (feed, protocol) cell. They **cannot know** when:
- a feed touches a protocol indirectly (e.g. Stablewatch shows `sUSDS-Sky` which Spark surfaces — Spark coverage = `partial`)
- a `not covered` cell has been **manually verified** as truly absent (vs. just not yet checked)
- a cell needs a one-off **manual override** (use sparingly — extending the adapter is preferred)

Those three calls are human judgment. They live here.

## File shape

```yaml
# data/overlays/stablewatch.yaml
#
# Lifecycle: edit this file → run `npm run build:data` → counts and tooltips
# update everywhere (matrix UI, COVERAGE.md, per-protocol pages).

partial:
  # Cells the adapter said `not covered` but a human knows touch the protocol indirectly.
  # Renders as the RFP `partial` yellow dot in the UI matrix and the COVERAGE Partial table.
  - protocol: spark
    why: sUSDS surfaced via Spark UI; Stablewatch attributes issuer to Sky.
    url: https://www.stablewatch.io/analytics/assets/sUSDS-Sky
    inline: "1 stable (via Sky)"   # optional matrix-cell text
    date: 2026-06-22
    by: IVa

verified_absent:
  # Cells the adapter said `not covered` AND a human confirmed the source genuinely
  # doesn't carry the protocol. Stays `—` in the matrix but the UI tooltip and
  # COVERAGE.md flip from `? unverified` to `✓ verified`.
  - protocol: lido
    date: 2026-06-22
    url: https://stablewatch.io        # searched, 0 hits
    note: Lido issues stETH (rebasing), not a YB-stable that Stablewatch indexes
    by: IVa

covered_override:
  # Rare: cell the adapter missed but a human knows is covered. Prefer extending
  # the adapter's slug map. Use only when the source isn't programmatically parseable.
  - protocol: foo
    inline: "X markets"
    url: https://...
    date: 2026-06-22
    by: IVa
```

All three sections are optional. An empty / missing overlay file = no human intervention applied; the adapter snapshot is taken as-is.

## Workflow

1. **Review a feed** by opening `COVERAGE.md` and finding rows marked `? unverified`.
2. **Visit the feed's source** for each row. Three possible outcomes:
   - **Truly absent** → add to `verified_absent`.
   - **Indirectly present** (related asset, wrapped, etc.) → add to `partial`.
   - **Adapter missed it** → tell the assistant; the adapter's slug map gets extended (preferred). Only fall back to `covered_override` if the source can't be parsed.
3. **Run `npm run build:data`**. Counters in the UI header and the COVERAGE.md tables update.

## Where the data lands

```
data/adapters/<feed>/output/*.json   (machine layer — verbatim from source)
                       +
data/overlays/<feed>.yaml            (human layer — partial / verified / override)
                       ↓ feeds-to-json.mjs
public/data/feeds/<feed>.json        (merged — UI + COVERAGE read from here)
                       ↓
public/data/protocols/<slug>.json    (per-protocol view)
public/data/index.json               (matrix view)
COVERAGE.md                          (operator audit log)
```

Adding a new adapter or a new protocol never requires touching this directory. Overlays are purely a post-hoc curation surface.
