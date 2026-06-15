---
subject: Aave v3 (Ethereum Core instance)
generated: 2026-06-14
ontology: vocab.ttl (https://relatum.xyz/ns/rfp#)
files: 1 vocab + 8 per-feed + 1 combined
---

# Aave v3 — what one protocol entry looks like across 8 feeds, as RDF

## What we built

For a single protocol (**Aave v3 Ethereum Core**), we pulled what each of 8 risk
aggregators says about it — real ratings, scores, permission findings, dependencies,
coverage statements — and emitted Turtle triples attributed to the originating feed.

The vocabulary (`vocab.ttl`) defines `rfp:Feed`, `rfp:Claim`, `rfp:Rating`,
`rfp:Score`, `rfp:Finding`, `rfp:CoverageStatement` and the predicates that link them.
Every triple in a feed file carries `rfp:statedBy feed:<name>` — so the same subject
can hold contradictory claims without the aggregator ever blending them. That maps
directly to the RFP's "no composite scoring" rule.

The combined graph is `aave-v3.combined.ttl`. Open it in any RDF tool (rdflib,
Apache Jena, GraphDB) and query with SPARQL.

## Measured triple counts (parsed with rdflib, real values)

| File | Triples | Subjects | Predicates | Class declarations |
|---|---:|---:|---:|---:|
| `vocab.ttl` (ontology + feed registry) | **122** | — | — | — |
| `aave-v3.defiscan.ttl` | **138** | 26 | 12 | 26 |
| `aave-v3.blockanalitica.ttl` | 79 | 14 | 9 | 14 |
| `aave-v3.pharos.ttl` | 116 | 21 | 12 | 21 |
| `aave-v3.defisphere.ttl` | 75 | 15 | 9 | 15 |
| `aave-v3.defisaver.ttl` | 65 | 13 | 7 | 13 |
| `aave-v3.credora.ttl` | 42 | 7 | 11 | 7 |
| `aave-v3.curatorwatch.ttl` | 21 | 6 | 6 | 6 |
| `aave-v3.stablewatch.ttl` | 10 | 2 | 7 | 2 |
| **Total feed triples (one protocol)** | **545** | 103 | 15 | — |
| **Combined graph (feeds + vocab)** | **667** | | | |

Distribution insight: **DeFiScan + Pharos contribute 47% of triples for one
protocol**. DeFi Saver and CuratorWatch are sparse because their *primary entity*
is not the protocol — for DeFi Saver it's a user position, for CuratorWatch it's
a curator. Stablewatch is sparsest (10 triples) because its entity is a
yield-bearing stablecoin and Aave-the-protocol has no direct entry. Those low
counts are still *informative* — they are explicit `CoverageStatement` triples
(`coverageStatus: notCovered` with reason), which is how the RFP brief's
"coverage gaps treated as data" requirement manifests.

## Projections for the v1 launch (top 20 Ethereum protocols)

**Three scaling models**, depending on how granularly we model the feed output:

| Modeling depth | Per-protocol triples | × 20 protocols | + vocab | Total |
|---|---:|---:|---:|---:|
| **Shallow (current density)** | 545 | 10,900 | 122 | **~11k** |
| **Average across 20** (some protocols less covered than Aave) | ~350 | 7,000 | 122 | **~7k** |
| **Deep DeFiScan permission expansion** | +412 perm triples/protocol × 5 props | +41,200 | — | **~50k** |
| **+ historical snapshots (weekly, 1 year)** | × ~52 | — | — | **~360k–2.5M** |

Numbers above are computed, not eyeballed:
- DeFiScan's `defiscan-data/Aave-v3-ethereum/result.json` shows **51 contracts,
  746 functions, 412 of them msg.sender-gated**. If we materialize each
  permissioned function as its own `rfp:Permission` subject with ~5 properties
  (contract, function name, modifiers, sender-condition, severity), that's
  ~2k triples *just from DeFiScan's permission scanner on Aave alone*.
- A live aggregator will want to retain dated claims (each rating gets
  `rfp:observedAt`). Weekly snapshots × 52 weeks × 20 protocols pushes the graph
  into the 100k-1M range within a year. Still tiny by RDF triplestore standards
  (Apache Jena, Blazegraph, GraphDB all comfortably hold billions).

**Bottom line for the application form: the v1 graph is small.** This is *not*
an engineering problem — it's a curation, schema-design, and provenance problem.
A laptop running an in-process rdflib store handles the entire v1 graph; any
real triplestore handles 10 years of weekly snapshots without breathing hard.

## What's in the Aave v3 combined graph right now

Run any of these in SPARQL against `aave-v3.combined.ttl`:

```sparql
# All claims about Aave v3 Ethereum, grouped by feed
PREFIX rfp: <https://relatum.xyz/ns/rfp#>
PREFIX aave: <https://relatum.xyz/ns/protocol/aave/>
SELECT ?feed ?dim ?value WHERE {
  ?c rfp:about aave:v3-ethereum ;
     rfp:statedBy ?feed ;
     rfp:dimension ?dim .
  OPTIONAL { ?c rfp:ratingValue ?value } UNION { ?c rfp:scoreValue ?value }
} ORDER BY ?feed ?dim
```

```sparql
# How many of our 8 feeds covered Aave v3 at all
SELECT (COUNT(DISTINCT ?feed) AS ?coveringFeeds) WHERE {
  ?c rfp:about aave:v3-ethereum ;
     rfp:statedBy ?feed .
  FILTER NOT EXISTS { ?c rfp:coverageStatus "notCovered" }
}
```

```sparql
# Disagreement detector: dimensions where two feeds emit different ratings
SELECT ?dim (GROUP_CONCAT(CONCAT(STR(?feed),"=",?val); separator=" | ") AS ?conflicts) WHERE {
  ?c rfp:about ?subj ;
     rfp:statedBy ?feed ;
     rfp:dimension ?dim ;
     rfp:ratingValue ?val .
} GROUP BY ?dim HAVING (COUNT(DISTINCT ?val) > 1)
```

The third query is the demo. It is *what the RFP exists for*.

## Per-feed character (what each feed is good at, in graph terms)

| Feed | Dominant claim type | Granularity | What lights up the graph |
|---|---|---|---|
| DeFiScan | `Rating` + `Finding` (Stage, 5-axis risks, 9 stage requirements, permission roles, dependencies) | Protocol-level | Permission scanner: 51 contracts → 412 permissioned functions → fertile ground |
| Pharos | `Rating` + `Score` (overall + 5 sub-grades + PSI/DEWS/MAS) | Stablecoin (here: GHO) | 5-dimension grade matrix + 4 numeric 0–100 scores per stablecoin |
| Block Analitica | `Score` (live params) | Per-market | wstETH/USDC market: 10+ numeric metrics; multiply by ~30 markets per protocol |
| DeFi Sphere | `Score` (market_risk, liquidity_risk) | Per-market | ~3-5 markets per protocol × 4-6 scores |
| Credora | `Rating` (A+..D) + `Score` (PSL) | Token / vault / pair | One letter rating per rated entity; PSL at multiple horizon × confidence |
| DeFi Saver | `Finding` (mirror + strategies + actions) | Protocol surface + user positions | Parameter mirror — no risk score; strategy templates as findings |
| CuratorWatch | `CoverageStatement` (mostly) | Curator-of-protocol | Aave-as-protocol not covered; curators *of* Aave (Gauntlet, Spark) are |
| Stablewatch | `CoverageStatement` (mostly) | Yield-bearing stablecoin | Aave-as-protocol not covered; aTokens are coverage candidates |

## Why this shape, for the application

The RFP says **"the aggregation is itself the value"** and **"coverage gaps treated
as data rather than smoothed away"**. The graph model literally implements both:

1. **Aggregation = JOIN**: every claim is a separate triple set, attributed to a
   feed. The aggregator's read API is "give me every claim about subject X".
   No transformation, no composite.

2. **Coverage gap = explicit triple**: when Stablewatch doesn't cover Aave, the
   graph contains a `CoverageStatement` triple saying so, with a reason. The UI
   renders a "not covered" tile — which is *information*, not a missing row.

3. **Auditability**: `rfp:statedBy` + `rfp:sourceURL` + `rfp:observedAt` give
   every claim a provenance trail. Any user, EF reviewer, or feed maintainer
   can verify a claim.

4. **Future-proof**: adding a 9th feed = drop in a new `aave-v3.<feed>.ttl` and
   reparse. No schema change. No backfill. No score recompute.

## Files in this directory

```
rdf/
├── vocab.ttl                       — rfp: vocabulary + feed registry (122)
├── aave-v3.defiscan.ttl            — 138 triples
├── aave-v3.blockanalitica.ttl      —  79
├── aave-v3.pharos.ttl              — 116
├── aave-v3.defisphere.ttl          —  75
├── aave-v3.defisaver.ttl           —  65
├── aave-v3.credora.ttl             —  42
├── aave-v3.curatorwatch.ttl        —  21
├── aave-v3.stablewatch.ttl         —  10
├── aave-v3.combined.ttl            — 667 (vocab + all feeds, re-serialized)
└── _methodology.md                 — this file
```
