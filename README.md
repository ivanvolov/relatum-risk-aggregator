# Relatum mockup

Static UI mockup for the EF RFP *Neutral DeFi Risk Intelligence Aggregator*.
Three pages, no build step — open `index.html` in any browser.

## What's here

| File | What it is |
|---|---|
| `index.html`            | Summary matrix — 20 protocols × 17 feeds, sortable, with coverage badges |
| `protocol-aave.html`    | Aave v3 detail page — fully populated worked example |
| `methodology.html`      | Methodology + provenance taxonomy + feed registry |
| `styles.css`            | One stylesheet (L2Beat / DeFiScan visual family) |
| `data.js`               | Pre-baked from the RDF graph in `proposals/EF/data/protocols/rdf/` |
| `app.js`                | Matrix sort/filter + detail rendering |

## Design references

The RFP's appendix names L2Beat, Walletbeat, and DeFiScan as reference points.
This mockup follows that family:

- **Data-dense, low chrome.** No marketing copy, no hero sections, no big illustrations.
- **Coverage status on every cell.** The summary matrix has a labeled dot at every (protocol, feed) intersection — covered / partial / not yet covered — matching the RFP's "every cell in the protocol-by-feed matrix is assessed and labeled" requirement.
- **Verbatim ratings.** On the protocol detail page each feed gets its own card with the feed's own scale, units, and language. No normalization.
- **Provenance pills.** Onchain / feed / curated / self-reported, rendered next to every value group.

## How the data flows

```
proposals/EF/data/protocols/rdf/             ← RDF (Turtle) graph — the data layer
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
  g.parse('../data/protocols/rdf/aave-v3.combined.ttl'); print(len(g))"
# → 667
```
