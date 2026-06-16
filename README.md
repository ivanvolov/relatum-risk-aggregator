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

No build step, no server, no dependencies.

```bash
git clone https://github.com/ivanvolov/relatum-risk-aggregator
cd relatum-risk-aggregator
open index.html        # macOS — or just double-click the file
```

For path-relative resource loading (the `data/feeds/*.yaml` schema links) to work in some browsers, you can also serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## What's here

| Path | What it is |
|---|---|
| `index.html`            | Summary matrix — 20 protocols × 15 feeds, sortable, with coverage badges |
| `protocol-aave.html`    | Aave v3 detail page — fully populated worked example |
| `methodology.html`      | Methodology + provenance taxonomy + feed registry |
| `styles.css`            | One stylesheet (L2Beat / DeFiScan visual family) |
| `data.js`               | Pre-baked from the RDF graph in `data/rdf/` |
| `app.js`                | Matrix sort/filter + detail rendering |
| `data/_protocols.yaml`  | Seed-20 protocol list with DefiLlama TVL (2026-06-14 snapshot) |
| `data/feeds/<feed>.yaml`| Per-feed schema docs — entity model, scales, anchor examples, known gaps. 12 of 15 committed at v0.1 |
| `data/rdf/vocab.ttl`    | The `rfp:` ontology + feed registry |
| `data/rdf/aave-v3.*.ttl`| Per-feed claims about Aave v3 (8 feeds) + the merged 667-triple combined graph |

### What a feed schema doc contains

Each `data/feeds/<feed>.yaml` captures the feed's ontology before any of its data is mapped into the graph:

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
data/rdf/             ← RDF (Turtle) graph — the data layer
   ├── vocab.ttl                              rfp: ontology + feed registry
   ├── aave-v3.<feed>.ttl  × 8                per-feed claims about Aave
   └── aave-v3.combined.ttl                   merged, 667 triples
                ↓ (in production: SPARQL query at request time)
                ↓ (in this mockup: pre-baked into data.js)
   data.js
                ↓
   index.html / protocol-aave.html / methodology.html
```

In production the HTML is rendered server-side or client-side from a SPARQL
query against the live graph. For this mockup `data.js` is a static snapshot
so the pages work by double-click without a server.

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

- Only Aave v3 has the full detail-page worked example. The remaining 19
  protocols share the same template; the data layer (`data.js`) extends mechanically.
- The matrix coverage values are best-known approximations based on each
  feed's public scope as of June 2026. In production the coverage state is
  computed from the presence/absence of claims in the live graph, not stored
  by hand.
- No backend, no auth, no community-correction PR flow (that's M2 scope).
  The data-layer-as-RDF design makes the PR flow trivial: one feed = one
  Turtle file = one PR.

## Reproducibility

The triple counts on the methodology page are real, measured with rdflib:

```bash
python3 -c "from rdflib import Graph; g=Graph(); \
  g.parse('data/rdf/aave-v3.combined.ttl'); print(len(g))"
# → 667
```

## License

Planned: AGPL-3.0 at W0 of the grant timeline (per [`PROPOSAL.md`](PROPOSAL.md) §Timeline). The mockup ships in this repo for review; the license file lands when the substrate codebase is migrated in.

## Contact

Ivan Volovyk · vivan.volovik@gmail.com · [@LisVikkk](https://x.com/LisVikkk) · [t.me/IVIkkk](https://t.me/IVIkkk)
