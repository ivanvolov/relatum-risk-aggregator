# Relatum mockup

Static UI mockup submitted with Ivan Volovyk's application to the EF App Relations RFP *Neutral DeFi Risk Intelligence Aggregator* (deadline 2026-06-15 AoE). Three pages, no build step — open `index.html` in any browser, or visit the deployed copy at [ivanvolov.github.io/relatum-risk-aggregator](https://ivanvolov.github.io/relatum-risk-aggregator/).

The full grant proposal is at [`PROPOSAL.md`](PROPOSAL.md).

Self-contained: the RDF graph that backs the mockup, the per-feed schema docs, and the seed-20 protocol list all live under `data/` in this repo. No external paths.

## About this submission

Relatum is a methodology for working with cross-domain data — on-chain state, protocol docs, governance forums, cap tables, off-chain entities — as a single knowledge graph against a shared ontology, with provenance and a time range on every fact. The broader research line lives at the [Relatum research note](https://forested-bottom-168.notion.site/Relatum-34d8a6cbc71a80cf9263ff6cf31702cc) — this repo is one specialised application of it.

For this grant the substrate is narrowed to one specific application: a knowledge graph of the major DeFi protocols, compacted from everything every major risk feed publishes about them, queryable for many different risk questions **without Relatum ever producing a number of its own.**

Neutrality is enforced at the schema layer, not by editorial restraint. The ontology has no predicate for a composite score and no query path that produces one — so a "Relatum risk score" cannot be introduced without a charter amendment and written EF agreement.

The aggregation the RFP asks for is a single SPARQL query — every dimension where any two feeds disagree, returned with the conflicting values intact, sources preserved. That query *is* the product. See the methodology page or [`PROPOSAL.md`](PROPOSAL.md) for the full framing.

## Run locally

The frontend `fetch()`es `data/index.json` and `data/protocols/<slug>.json` at page load, so you need a static server (browsers block `fetch` from `file://`):

```bash
git clone https://github.com/ivanvolov/relatum-risk-aggregator
cd relatum-risk-aggregator
python3 -m http.server 8000
# then visit http://localhost:8000/
```

GH Pages (https) is the deployed equivalent — no configuration needed beyond Settings → Pages → Source = `main` / root.

## Regenerate the data layer

The JSON the frontend reads is generated from the RDF ontology by a small Node pipeline. Re-run it after editing any TTL or `_prose.yaml`:

```bash
cd scripts
npm install                # one-time: pulls n3 + yaml
node build-all.mjs         # combine-ttl → ttl-to-json → build-index
```

Output lands in `data/index.json` + `data/protocols/<slug>.json`. Commit both.

## What's here

| Path | What it is |
|---|---|
| `index.html`             | Summary matrix — 20 protocols × 15 feeds, sortable, with coverage badges |
| `protocol-aave.html`     | Aave v3 detail page — fully populated worked example |
| `protocol-<slug>.html`   | Detail page for each of the other 19 protocols (template; renders coverage badges + stub cards) |
| `methodology.html`       | Methodology + provenance taxonomy + feed registry |
| `styles.css`             | One stylesheet (L2Beat / DeFiScan visual family) |
| `app.js`                 | Async fetch loaders + matrix / detail / registry rendering |
| `data/index.json`        | Generated — feed registry + protocol list + coverage matrix the summary page reads |
| `data/protocols/<slug>.json` | Generated — per-protocol detail the worked-example page reads |
| `ontology/vocab.ttl`     | The `rfp:` ontology (schema only) |
| `ontology/feeds.ttl`     | Feed registry — instances of `rfp:Feed`, methodology URLs |
| `ontology/protocols/<slug>/combined.ttl` | Canonical merged TTL per protocol (aave-v3 is the worked example: 667 triples across 8 feeds) |
| `ontology/protocols/<slug>/<feed>.ttl`   | Per-feed claim files; concatenated by `scripts/combine-ttl.mjs` |
| `ontology/protocols/<slug>/_prose.yaml`  | Hand-curated overlay — sidecards, audit history, per-feed methodology / notable / findings prose |
| `feeds/<feed>.yaml`      | Per-feed schema docs — entity model, scales, anchor examples, known gaps |
| `build/lib/registry.mjs` | One canonical list — the RFP §3 seed-20 protocols + the 15-entry feed registry. Edit here to add a protocol or feed. |
| `seeds/coverage-seed.yaml` | Baseline coverage matrix for protocols without a wired-up feed adapter; overridden once `public/data/feeds/<feed>.json` exists |
| `scripts/`               | Build pipeline (TTL → JSON), see "Regenerate the data layer" above |
| `adapters-raw/`          | Local scrapers (per-feed `.mjs`) + dated raw scrape outputs — quarantined, not browser-visible |

### What a feed schema doc contains

Each `feeds/<feed>.yaml` captures the feed's ontology before any of its data is mapped into the graph:

- **Identity** — name, homepage, maintainer, license, access mode, update cadence.
- **Data model** — the primary entity each assessment yields (e.g. `ProtocolAssessment`, `VaultAssessment`, `AttestedRiskScore`), its properties, scoring dimensions, and native scales.
- **Anchor example** — what one extract looks like for a named protocol (Aave v3 in most cases) — concrete, not handwavy.
- **Known gaps** — what the feed's public surface doesn't yet expose, with provenance timestamps so the doc ages honestly.

The goal: make every provider's ontology legible and PR-able as a small YAML, separate from the Turtle claims it eventually generates.

## Design references

The RFP's appendix names L2Beat, Walletbeat, and DeFiScan as reference points.
This mockup follows that family:

- **Data-dense, low chrome.** No marketing copy, no hero sections, no big illustrations.
- **Coverage status on every cell.** The summary matrix has a labeled dot at every (protocol, feed) intersection — covered / partial / not yet covered — matching the RFP's "every cell in the protocol-by-feed matrix is assessed and labeled" requirement.
- **Verbatim ratings.** On the protocol detail page each feed gets its own card with the feed's own scale, units, and language. No normalization.
- **Provenance pills.** Onchain / feed / curated / self-reported, rendered next to every value group.

## How the data flows

```
adapters-raw/scrapers/<feed>.mjs        ← scrapers (run locally)
        ↓ produce
adapters-raw/output/<feed>-YYYY-MM-DD.json
        ↓ map (per-feed adapter, written incrementally; only aave-v3 done so far)
ontology/protocols/<slug>/<feed>.ttl    ← per-feed RDF claims
        ↓ scripts/combine-ttl.mjs (concat + normalise prefixes)
ontology/protocols/<slug>/combined.ttl  ← canonical per-protocol graph
        ↓ scripts/ttl-to-json.mjs (n3 parse + _prose.yaml overlay)
data/protocols/<slug>.json              ← per-protocol JSON the browser fetches
        ↓ scripts/build-index.mjs (rolls per-feed status up into a coverage matrix)
data/index.json                         ← summary page + cross-protocol metadata
        ↓ fetch() at page load
index.html / protocol-*.html / methodology.html
```

Pipeline stages live in `scripts/`; run `node scripts/build-all.mjs` after editing any TTL or `_prose.yaml`. The frontend has no runtime dependency on the ontology — it only reads `data/*.json`. In production the per-feed TTL would be generated nightly by GH Actions; for this submission the scrapers run locally and the JSONs are committed.

## Mapping to RFP M1 deliverables

| RFP M1 requirement | Mockup demonstration |
|---|---|
| Production app at stable URL | `index.html` (static, deploy-anywhere) |
| Top 20 seed protocols populated | 20 rows in the matrix |
| Dedicated detail page per protocol | `protocol-aave.html` worked end-to-end; other 19 share template |
| Live TVL (from DefiLlama) | TVL column on summary; per-protocol sidecard |
| Governance data surfaced | "Governance" sidecard on detail page with onchain provenance pill |
| Every matrix cell labeled (covered / partial / not yet) | Three-state dot legend; explicit `CoverageStatement` triples in graph |
| Methodology page documenting feed registry and provenance tags | `methodology.html` |

## What's not here (yet)

- Only Aave v3 has a `combined.ttl` + `_prose.yaml` and renders the full detail page. The other 19 protocols use the same template but render the stub fallback (coverage badges + per-feed cards seeded from `seeds/coverage-seed.yaml`); their per-feed TTLs are pending — see `scripts/adapter-to-ttl/` for the staging dir.
- The summary coverage matrix is currently a mix of TTL-derived statuses (aave) and the hand-curated seed (the 19 stubs). When per-feed adapters land they replace seed rows incrementally; the build script prefers TTL-derived coverage whenever a `combined.ttl` exists.
- No backend, no auth, no community-correction PR flow (that's M2 scope).
  The data-layer-as-RDF design makes the PR flow trivial: one feed = one
  Turtle file = one PR.

## Reproducibility

The triple counts on the methodology page are real, measured with rdflib:

```bash
python3 -c "from rdflib import Graph; g=Graph(); \
  g.parse('ontology/protocols/aave-v3/combined.ttl'); print(len(g))"
# → 667
```

## License

Planned: AGPL-3.0 at W0 of the grant timeline (per [`PROPOSAL.md`](PROPOSAL.md) §Timeline). The mockup ships in this repo for review; the license file lands when the substrate codebase is migrated in.

## Contact

Ivan Volovyk · vivan.volovik@gmail.com · [@LisVikkk](https://x.com/LisVikkk) · [t.me/IVIkkk](https://t.me/IVIkkk)
