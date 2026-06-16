---
title: "Proposal — Neutral DeFi Risk Intelligence Aggregator"
working_name: "Relatum"
applicant: "Ivan Volovyk"
date: "2026-06-14"
rfp: "EF App Relations, deadline 2026-06-15 AoE"
---

# Neutral DeFi Risk Intelligence Aggregator (Relatum)

Ivan Volovyk · vivan.volovik@gmail.com · 2026-06-14

---

## Relatum

Relatum is a methodology for working with cross-domain data — on-chain state, protocol docs, governance forums, cap tables, off-chain entities — as a single knowledge graph against a shared ontology, with provenance and a time range on every fact. 
I've been building it as a substrate for systemic DeFi risk assessment, where the failures that matter most live in the relationships between protocols rather than inside any one of them.

For this grant the substrate is narrowed to one specific application: a knowledge graph of the major DeFi protocols, compacted from everything every major risk feed publishes about them, queryable for many different risk questions without Relatum ever producing a number of its own. (Full research note: [RDF and machine-generated ontologies to map DeFi risks](https://forested-bottom-168.notion.site/Relatum-34d8a6cbc71a80cf9263ff6cf31702cc).)

## What we will build

The RFP deliverables:

- A production web application covering all 20 RFP seed protocols, showing live TVL/volume (DefiLlama), feed coverage status, governance data from on-chain and verifiable sources, and what each provider says verbatim.
- Every cell in the protocol-by-feed matrix labeled — covered, partial, or not yet covered.
- An open, community-correctable data layer with a documented process for corrections, new protocols, and new feed providers.
- A methodology page explaining the aggregation approach, the feed registry, and the data provenance model.

## Feed registry (15 providers)

The 14 RFP-listed providers — DeFiScan, BlockAnalitica, Pharos, CuratorWatch, DeFi Sphere, DeFi Saver, DeFiPunk'd, Credora, RiskLayer, pigi.finance, Xerberus, Zyfai Risk, LlamaRisk, Philidor — plus StableWatch.

StableWatch covers yield-bearing stablecoins: real APY, TVL, yield paid out, backing composition (RWA share, vault makeup), and NAV stress for wrappers. None of the other 14 tracks yield-bearing stablecoins as a primary product.

### The ontological substrate underneath

For the data layer to be community-correctable, machine-readable, and resilient to feed evolution without rewriting history, it has to be ontology-first — that is the cross-domain methodology work Relatum's research has already paid down. Specialising it for this domain takes three pieces of build:

1. **Design the domain ontology for "risk feeds × DeFi protocols."** Define the entities (protocols, dependencies, feed providers, assessments) and the predicates (covers, rates, references, was-issued-by) so DeFiScan's decentralization stages, Credora's credit grades, LlamaRisk's per-asset analyses, DeFiPunk'd's five-principle grades, Xerberus's percent subscores, and the rest each have a place in the graph without colliding. The ontology has no predicate for a composite score and no query path that produces one — neutrality is a property of the schema, not a downstream constraint.
2. **Build the ingestion layer.** One adapter per provider in the registry. Each adapter pulls the provider's published assessment, maps it into triples against the ontology while preserving native scales and units, and commits every change as a versioned update to the public repo. Automated where providers expose machine-readable data, with documented manual paths where they don't.
3. **Build the public surface.** A web app over the substrate that shows, for each of the top 20 Ethereum DeFi protocols, what every feed has said about it, what no feed has covered (coverage gaps are themselves data), governance and incident history, and the source of every fact. Plus the open data layer the RFP asks for: contribution flow via PR (corrections, new protocols, new feeds), SPARQL endpoint for downstream consumers, CODEOWNERS-routed review.

## Data layer prototype

The data layer is an RDF knowledge graph. Every claim carries `statedBy <feed>`, `sourceURL`, and `observedAt` — DeFiScan's `Stage 0`, Credora's `A-`, and Pharos's `B` sit alongside each other as three independent observations about Aave, each traceable to its source. Aggregation is a query choice, not a forced output of the substrate.

A working graph for Aave v3 across 8 feeds is committed at **667 triples** — DeFiScan, BlockAnalitica, Pharos, DeFi Sphere, DeFi Saver, Credora, CuratorWatch, StableWatch. The other 7 fit the same shape: a new feed is a new file plus a registry entry, no schema change. Numbers below are measured.

| | Per protocol | × 20 protocols | + 26 weekly snapshots (half-year) |
|---|---:|---:|---:|
| Current density (8 feeds modeled, Aave v3) | 545 | ~11k | ~285k |
| With DeFiScan permission-scanner fully materialised (M2 automation target) | ~2.5k | ~50k | ~1.3M |
| With BlockAnalitica per-market live snapshots | ~3.0k | ~60k | ~1.6M |

The v1 graph runs in-process on a laptop. Production triplestores (Apache Jena, Blazegraph, oxigraph) handle 10⁹+ triples on a single server — at half-year horizon we are 3–4 orders of magnitude below that. Infrastructure is not the risk — curation, provenance, and feed onboarding are.

The query that *is* the product — every dimension where any two feeds disagree, returned with the conflicting values intact:

```sparql
SELECT ?dim (GROUP_CONCAT(CONCAT(STR(?feed),"=",?val); separator=" | ") AS ?conflicts)
WHERE {
  ?c rfp:about ?subj ; rfp:statedBy ?feed ;
     rfp:dimension ?dim ; rfp:ratingValue ?val .
} GROUP BY ?dim HAVING (COUNT(DISTINCT ?val) > 1)
```

The aggregation the RFP asks for is this query, not a score.

## How neutrality is enforced structurally

- DeFiScan's `Stage 0` and Philidor's `7/10` are two independent observations about the same dimension (governance decentralization). The graph relates them. It never reduces them to a shared scale.
- When a provider changes their rating system next year, new ratings attach under new predicates. Old assessments stay queryable at their original fidelity. Schema changes don't rewrite history.
- There is no field in the data model for "Relatum's score." There is no query path that produces one. Enforced by the ontology, not by editorial restraint.
- Every fact carries a provenance tag (on-chain, feed-published, human-curated, self-reported) and links to its source.

The data is machine-readable by construction. Auditors and downstream protocols can query *"what does every feed say about Lido's upgrade-key risk"* via standard SPARQL.

## Validation

The EF App Relations team identified this gap from sessions with 70+ DeFi protocol teams at EthCC, plus follow-ups through the year. Before shipping I run interviews with a representative slice of those teams plus the feed providers themselves, and adjust the UI and the registry based on what they say. Discrete budget line, not folded into engineering.

## Timeline (20 weeks)

| Week | Deliverable |
|---|---|
| W0 | Relatum's codebase cleaned up, relicensed AGPL 3.0, migrated to a public GitHub repo. `CHARTER.md` and contribution docs in. |
| W3 | AI and ranking stripped from data model and UI. Domain ontology and schemas published as an RFC. First stakeholder calls running. |
| W9 | All 15 feeds wired in. Automated where providers expose machine-readable data. Manual paths documented otherwise. |
| **W12 — M1** | Live at `relatum.app`. All 20 protocols covered. Every protocol-by-feed cell labeled. Methodology page up. Community contribution process operational. |
| W17 | First batch of external corrections accepted and merged. PR workflow proven end-to-end. |
| **W20 — M2** | Feed coverage automated wherever providers expose data publicly, manual curation reserved for the rest. Roadmap for protocol expansion published. Contribution model operational end-to-end (per W17). `CHARTER.md` committed defining the no-composite-scoring constraint. Named long-term steward confirmed in writing. |

## Budget — $12,000

| Line | $ | What |
|---|---|---|
| Engineering | 10,000 | Solo applicant labor across all 20 weeks: strip AI/ranking, build the domain ontology, build the 15-feed ingestion layer, curate governance/audit/incident history for the 20 protocols, ship the UI refit, run stakeholder outreach. |
| Infrastructure | 2,000 | Backend pipeline (cron-driven ingestion workers, RDF triplestore, SPARQL endpoint), frontend hosting, domain, CI, third-party APIs. Pipeline runs continuously even though data versions to GitHub — backend compute is the real ongoing cost. Covers the 5-month build plus ~12 months of post-launch runway. |

Design and data curation fold into Engineering, ongoing maintenance into Infrastructure.

## Team

**Ivan Volovyk**
[GitHub](https://github.com/ivanvolov) · [X](https://x.com/LisVikkk) · [TG](https://t.me/IVIkkk)

ex-[Lumis](https://x.com/lumisfi_) co-founder. Designed and built Relatum's substrate, ontology, and pipelines.

### Public-goods track record

- **[Relatum substrate](https://relatum.app)** — the cross-domain knowledge-graph substrate this proposal narrows to one DeFi-risk application.
- **Relatum research note** — methodology for the substrate and the DeFi risk interdependency model. → [forested-bottom-168.notion.site/Relatum](https://forested-bottom-168.notion.site/Relatum-34d8a6cbc71a80cf9263ff6cf31702cc)
- **[Web3 Privacy Explorer](https://explorer.web3privacy.info/)** — directory of web3-privacy projects with audits, teams and governance data. Responsible for data pipelines.
- **[Research Agents Dashboard](https://research-agents-dashboard.onrender.com/graph)** — automated open-source system that discovers new privacy projects using a contributor knowledge graph.
- **[Security Messengers Rating](https://messengers-rating.netlify.app/)** — open comparison rating across secure messengers.
- **[Moat](https://qf.giveth.io/project/open-source-smart-contract-firewall)** — open-source smart-contract firewall. In progress, accelerated by The Dao Security Fund.
- **[LatCheck](https://giveth.io/project/self-hosted-ai-co-signer-for-your-transactions)** — self-hosted AI agent that acts as a mandatory co-signer on a wallet.


## Conflicts

- **DeFi protocols.** No.
- **Risk feed providers.** No.

## Stewardship

Me — because the same RDF substrate underpins my broader public-goods DeFi-tooling work.

If post-M2 review concludes Relatum belongs with an established institutional public-goods home, L2Beat or DeFiScan are natural successors.

## Mockup

This repo *is* the mockup. Three pages, no build step — `index.html` (summary matrix), `protocol-aave.html` (worked detail page), `methodology.html` (feed registry + provenance taxonomy). Deployed at [`ivanvolov.github.io/relatum-risk-aggregator`](https://ivanvolov.github.io/relatum-risk-aggregator/). Reproduces the EF POC's layout primitives — provenance tags, coverage pills, verbatim ratings — and shows the visual direction. Connecting it to live data is the M1 deliverable.
