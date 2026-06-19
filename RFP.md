---
source: https://docs.google.com/document/d/1eCtLN7oRiFdiS-Z6x35EtkOv8LZUsLzkE8iCCgi4P08/edit
fetched: 2026-06-13
title: "RFP: Neutral DeFi Risk Intelligence Aggregator (full project description)"
---

# RFP: Neutral DeFi Risk Intelligence Aggregator

Request for Proposals

Ethereum Foundation, App Relations | May 26, 2026 | Deadline: June 15, 2026

## 1. Problem and What We Are Looking For

DeFi risk intelligence is fragmented. Before deploying capital, users ranging from retail participants to institutional asset managers must navigate dozens of dashboards, rating services, and data providers. The information exists but there is no neutral layer that aggregates it into one place.

A growing ecosystem of risk frameworks and analytics dashboards (aka feeds) has emerged: BlockAnalitica, DeFiScan, DeFiPunk'd, CuratorWatch, Pharos, Credora, and others. Each has its own focus and methodology. The right mental model is oracle diversity: no single feed should be canonical for something this important. The aggregation is the value.

The Ethereum Foundation App Relations team ran sessions with 70+ DeFi protocol teams at EthCC 2026, paired with many additional live remote connections throughout the year. A neutral, unified risk reference was one of the most consistently raised gaps.

This RFP seeks a team to build that aggregation layer as a public good: a neutral, open source web application that shows what every major risk feed says about a protocol, side by side, without synthesis or scoring.

### Deliverables

- A production web application covering the [top 20 DeFi protocols](https://defillama.com/chain/ethereum) by funds at risk (TVL), showing feed coverage status, governance data, and what each provider says verbatim
- Every cell in the protocol-by-feed matrix is assessed and labeled. Coverage status (covered, partial, or not yet covered) shown explicitly for each protocol against each feed in the registry.
- An open, community-correctable data layer with documented process for corrections, new protocols, and new feed providers
- A methodology page explaining the aggregation approach, the feed registry, and data provenance
- A named steward confirmed before final payment: a specific individual or organization with public presence and long-term incentive to maintain the project

### Design Principle on Scoring

Composite scoring is out of scope. The project presents existing feed data without synthesis or editorial judgment. Any future addition of composite scoring requires written agreement from the Ethereum Foundation. This must be documented in a project charter committed to the repository.

### Proof of Concept

The EF App Relations team has built a working POC and full technical specification illustrating the vision. The POC is a design reference, not a production target. Protocol coverage, feed providers, and data shown are illustrative. Applicants are not expected to build on this codebase; they are expected to build something better. Shortlisted applicants will receive GitHub access, and screenshots can be found in the Appendix.

## 2. Requirements

Hard requirements must be met to be considered. Soft requirements are nice to have and will weigh in scoring.

| Requirement | Detail | Type |
| :-: | :-: | :-: |
| Open source | Full codebase and data layer AGPL 3.0 licensed and publicly available on GitHub | Hard |
| Ethereum-native | Primary focus on Ethereum mainnet protocols. Cross-chain out of scope for v1. | Hard |
| No composite scoring | Must not produce its own risk scores or composite assessments. Feed ratings shown verbatim only. | Hard |
| Neutral positioning | No undisclosed commercial relationships with listed protocols. All conflicts must be declared. | Hard |
| Top 20 coverage | All 20 seed protocols in Section 3 populated at launch | Hard |
| Live TVL/Volume | TVL or equivalent volume metric where TVL is not applicable | Hard |
| Named steward | Named individual or org confirmed as long-term steward before final payment | Hard |
| Team track record | At least one team member with shipped production DeFi tooling or data infrastructure | Hard |
| Feed relationships | Active relationships with listed providers that could accelerate data quality or automation | Soft |
| Feed automation | Coverage automated where providers expose data publicly, rather than manually curated | Soft |
| Governance data | Governance data sourced from onchain or verifiable sources rather than solely self-reported | Soft |
| Design quality | Legible, data-dense interface. Reference points: L2Beat, Walletbeat, DeFiScan. | Soft |
| Public goods track record | Prior contributions to Ethereum public goods, open source tooling, or ecosystem infrastructure | Soft |

## 3. Seed Protocol List

Top 20 Ethereum-ecosystem DeFi protocols by TVL or equivalent volume where TVL is not applicable, prioritizing protocols where user capital is directly at risk. Applicants should verify rankings against [DefiLlama](https://defillama.com/chain/ethereum) at time of build.

| Protocol | Category | Notes |
| :-: | :-: | :-: |
| Spark | Lending | Sky sub-protocol. SparkLend and sUSDS. |
| Aave | Lending | Include v3 and v4. |
| Morpho | Lending | Core lending protocol. See also Morpho Vaults under Yield. |
| Fluid | Lending | Lending and DEX hybrid. |
| Gearbox | Lending | Credit account leverage protocol. |
| Euler | Lending | Modular vault lending. |
| Compound | Lending | Include v2 and v3. |
| Liquity | Lending | Include v1 and v2. Immutable CDP protocol. |
| Uniswap | DEX / AMM | Include v3, v4, and UniswapX. |
| Curve | DEX / AMM | Stablecoin and LST AMM infrastructure. |
| Balancer | DEX / AMM | Weighted and stable pools. |
| CoW Swap | Swap Aggregator | Intent-based DEX with MEV protection. |
| 1inch | Swap Aggregator | DEX aggregator and limit order protocol. |
| 0x / Matcha | Swap Aggregator | 0x protocol and Matcha frontend. |
| Yearn Finance | Yield / Vault | Automated yield vaults. |
| Mellow | Yield / Vault | Modular LRT vault infrastructure. |
| Morpho Vaults | Yield / Vault | Curated MetaMorpho vaults. |
| Pendle | Yield / Vault | Yield tokenization and fixed-rate trading. |
| Lido | Liquid Staking | Largest ETH staking protocol. stETH is the most widely used DeFi collateral and yield source. |
| Rocket Pool | Liquid Staking | Decentralized ETH staking. rETH. |

## 4. Risk Feed Registry

The list below is illustrative, not prescriptive. Applicants propose the final feed registry as part of the submission, with brief rationale for inclusions and exclusions. Strong proposals cover most of these providers and add others to maximize diversity of coverage methodologies.

| Provider | Focus | Type |
| :-: | :-: | :-: |
| DeFiScan | Decentralization maturity framework: who controls keys, upgrades, and admin powers | Rating |
| CuratorWatch | Vault-level risk monitoring for Morpho curators, tracking allocation risk and curator behavior | Dashboard |
| BlockAnalitica | Quantitative on-chain risk dashboards for lending markets: liquidations, collateral health, market exposure | Dashboard |
| DeFiPunk'd | Multi-dimension risk registry: Control, Exit, Autonomy, Open Access, Verifiability via distributed LLM consensus | Rating |
| Pharos | Real-time risk monitoring and automated alerts for live protocol risk events | Monitoring |
| DeFi Sphere | Multi-dimensional protocol analysis covering technical, financial, and operational risk | Rating |
| DeFi Saver | Live loan health and liquidation statistics for leveraged DeFi positions | Dashboard |
| Credora | Institutional-grade credit risk ratings for DeFi protocols and borrowers | Rating |
| RiskLayer | Economic security middleware built on EigenLayer. Proof of Risk consensus for decentralized, validator-attested risk scores. | Rating |
| pigi.finance | Vault analytics and risk-adjusted yield comparison across 50+ protocols. Tracks historical exploits, holder concentration, and risk-adjusted APY. | Dashboard |
| Xerberus | Independent risk rating protocol for DeFi vaults. 300+ subscores across 85+ mechanisms. Investor-focused and open-source. | Rating |
| Zyfai Risk | Real-time risk score dashboard for DeFi liquidity pools. Tracks risk metrics, TVL, APY, and security grades across pools. | Dashboard |
| LlamaRisk | Protocol risk research and parameter recommendations for DeFi. Analytics and monitoring focused on collateral and governance risk. | Research |
| Philidor Analytics | Deterministic vault risk scoring across 700+ vaults. Three-vector framework: asset quality, platform code maturity, and governance controls. Open methodology. | Rating |

## 5. Budget, Benefits, and Milestones

### Funding

The Ethereum Foundation anticipates allocating up to $15,000 for this grant. Total funding may increase beyond the base allocation, with the EF App Relations team working alongside the grantee to secure matching contributions from leading DeFi protocols and infrastructure teams. L2 coverage is out of scope for this grant but may be added as a follow-on milestone if matching funding is secured from L2 ecosystem teams.

Proposals should include a budget breakdown covering engineering, design, data curation, infrastructure, and ongoing maintenance.

### Grant Benefits Beyond Funding

This grant comes with material non-financial benefits:

- EF App Relations social amplification at announcement and throughout the project's development
- Direct introductions to DeFi protocol teams, risk feed providers, and institutional partners
- Access to the EF App Relations team as ongoing advisors

### Milestone Schedule

Funding is structured as a three-part allocation: 33% upfront, 33% upon completion of M1, and the final tranche following M2 delivery. All deliverables are subject to evaluation by the EF App Relations team prior to any fund release.

| Milestone | Deliverable | Payment |
| :-: | :-: | :-: |
| Grant Activation | Upfront allocation upon execution of the countersigned grant agreement. No specific technical deliverables required. | 33% upfront |
| M1 - Week 12 | • Production application deployed at a stable public URL. <br>• Public GitHub repository under AGPL 3.0, in place and developed in the open since project start, with a documented contribution and correction process in the README. <br>• All 20 seed protocols are populated, each with a dedicated detail page. <br>• Live TVL, or equivalent volume metric where TVL is not applicable, across all seed protocols, sourced from DefiLlama. <br>• Governance data surfaced for all seed protocols. <br>• Every cell in the protocol-by-feed matrix is assessed and labeled. Coverage status (covered, partial, or not yet covered) shown explicitly for each protocol against each feed in the registry. <br>• Methodology page live, documenting the feed registry and data provenance tags. | 33% upon Milestone 1 completion |
| M2 - Week 20 | • Feed coverage is automated wherever providers expose data publicly. Manual curation reserved for feeds without machine-readable outputs. <br>• A short roadmap outlining how protocol coverage expands beyond the initial 20 over time. <br>• Community contribution model demonstrably operational: at least one round of external corrections accepted and merged, with the workflow proven end to end. <br>• Project charter committed to the repository, defining the no-composite-scoring constraint and the process required to ever change it. <br>• Named steward confirmed in writing. The steward is a specific individual or organization with public presence and a stated commitment to long-term maintenance. | 34% upon Milestone 2 completion |

*The EF reserves the right to not approve payment after review of the deliverables.*

## 6. Submission

Submissions close June 15 AoE, 2026. Apply via the [application form](https://esp.ethereum.foundation/applicants/rfp/defi_risk_intel_agg/apply) and include artifacts listed below.

| Artifact | Detail |
| :-: | :-: |
| Proposal document | Maximum 5 pages. Cover: approach, milestone timeline, and budget breakdown. |
| Prior work | Links to 1-3 examples of relevant shipped work |
| Team information | Names, GitHub handles, and relevant experience for all core contributors |
| Conflict disclosures | Any commercial relationships with protocols listed in Section 3 or feed providers listed in Section 4 |
| Stewardship plan | Who will own and maintain the project after the grant period and why they are incentivized to do so |
| Prototype or mockup | Optional but weighted positively |

## Appendix: Proof of Concept Screenshots

**EF preamble (verbatim):**

> Appendix: Proof of Concept Screenshots
> Illustrative examples of the vision. Protocol coverage, feed providers, and data shown are not representative of final scope. Shortlisted applicants will receive GitHub access to the underlying codebase.

**Reference codebase (footer of methodology page):** `github.com/cpstl/openrisk` — almost certainly Charles St. Louis's repo (`cpstl` = Charlie St. Louis).

---

### Brand shown in the mock: "OpenRisk"

- Tagline: *every feed, one view*
- Nav: Protocols · Methodology · GitHub

---

### Screen 1 — Protocols dashboard

![EF POC Screen 1 — Protocols dashboard](poc-screenshots/summary.png)

**H1:** DeFi Risk Aggregator

**Intro paragraph (verbatim):**

> Like a great oracle aggregates many price feeds into one trusted value, OpenRisk aggregates many risk feeds into one trusted view. No scoring. No synthesis. Just well-sourced data from 17 risk intelligence providers across 26 protocols (20 entries, 4 grouped by family).

**Controls:** search box ("Search protocols…") + category filter chips:
`All` (active) · `CDP` · `DEX` · `Lending` · `Lending / RWA` · `Liquid Staking` · `Restaking` · `Synthetic Yield` · `Yield` · `Yield Lottery`

**Table columns (left → right):**
Protocol · Category · TVL ↓ · Gov · Feeds · DeFiPunk_d · BlockAn_ · DeFiScan · Curator_ · Pharos · DeFi Sp_ · DeFi Sa_ · Xerberus · Chronic_ · Account_ · Anticap_ · Exponen_ · LlamaRi_

**Cell vocabulary:**
- Green dot · yellow dot · em-dash (—) for "no coverage"
- `Stage 0` / `Stage 1` / `Stage 2` (DeFiScan column shows literal verbatim rating)
- `A` (Exponential.fi column shows literal letter grade)
- `Gov` column shows multisig threshold + timelock: `5/7 · 3d`, `5/9 · 2d`, `6/9 · 10d`, `2d`, `4/6 · 3d`, or em-dash
- `Feeds` column: `9 feeds`, `14 feeds`, etc.
- Family-grouped rows have a `▶` disclosure with version count, e.g. `▶ Aave (3 versions)`, `▶ Morpho (2 versions)`, `▶ Uniswap (3 versions)`, `▶ Compound (2 versions)`

**Rows visible (in order):**

| Protocol | Category | TVL | Gov | Feeds |
|---|---|---|---|---|
| Lido | Liquid Staking | $21.2B | 5/7 · 3d | 9 feeds |
| ▶ Aave (3 versions) | Lending | $14.6B | 5/9 · 2d | 14 feeds |
| EigenLayer | Restaking | $7.8B | 6/9 · 10d | 6 feeds |
| ▶ Morpho (2 versions) | Lending | $7.4B | 5/9 · 7d | 9 feeds |
| Sky (MakerDAO) | Lending / RWA | $5.6B | 2d | 11 feeds |
| Spark | Lending | $5.5B | 2d | 8 feeds |
| Ethena | Synthetic Yield | $4.4B | — | 9 feeds |
| ▶ Uniswap (3 versions) | DEX | $1.8B | 2d | 7 feeds |
| PancakeSwap V2 | DEX | $2.2B | — | 4 feeds |
| Curve | DEX | $1.7B | 4/6 · 3d | 9 feeds |
| Pendle | Yield | $1.5B | — | 7 feeds |
| ▶ Compound (2 versions) | Lending | $1.3B | 2d | 8 feeds |
| Aerodrome | DEX | $378M | — | 3 feeds |

---

### Screen 2 — Protocol detail (Lido)

![EF POC Screen 2 — Protocol detail page for Lido](poc-screenshots/detail-lido.png)

**Header block:**
- Title: **Lido** with `Liquid Staking` tag
- Network: Ethereum · `lido.fi`
- Description: *"Lido is the largest liquid staking protocol, allowing users to stake ETH and receive stETH while maintaining liquidity. stETH is a rebasing token that represents staked ETH plus accumulated staking rewards, and is widely used as collateral across DeFi."*
- `Data last updated: 2026-04-15`
- TVL pinned right: **$21.2B**

**Governance table** (with provenance tags per cell):

| Field | Value | Tag |
|---|---|---|
| Type | Dao | [onchain] |
| Multisig | 0x3e40…9C8c → | [onchain] |
| Threshold | 5/7 | [onchain] |
| Timelock | 3d | [onchain] |
| Signers known | Yes | [curated] |
| Pause capability | Yes | [curated] |
| Upgrade capability | Yes | [curated] |

Footer line: `Source →  Safe API fetch failed — showing static data` · *"This data is pulled from onchain and curated sources. Flag inaccuracies via GitHub."*

**Risk Intelligence Feeds section**

- H2 + right-aligned counter: **9 risk feeds available**
- Subhead: *"Each card is one provider's view of this protocol. Methodology shown before findings. Ratings shown verbatim where they exist. Coverage gaps below."*

Feed cards (3-column grid). Each card shape: **Provider name** · `Covered`/`Partial` pill · italic *methodology blurb* · plain finding line · `View assessment →` link · `[feed]` tag · ISO date.

| Provider | Status | Methodology blurb | Finding | Date |
|---|---|---|---|---|
| DeFiScan | Covered | *Decentralization maturity framework assessing who controls the keys, upgrades, and admin powers.* | Rating: **Stage 0**. Decentralization stage rating. | 2026-04-07 |
| Pharos | Covered | *Real-time risk monitoring and automated alerts for live protocol risk events.* | Staking risk monitoring. | 2026-04-07 |
| DeFi Sphere | Covered | *Multi-dimensional protocol analysis covering technical, financial, and operational risk.* | Multi-dimensional protocol analysis. | 2026-04-07 |
| Xerberus | Covered | *On-chain, evidence-based risk ratings for assets, protocols, and organisations. Every subscore references a real historical incident.* | Evidence-based risk rating. | 2026-04-07 |
| Anticapture | Covered | *Tracks hostile takeover risk, token concentration, delegate activity, and governance resilience across major DAOs.* | LDO governance and stETH holder representation. | 2026-04-07 |
| Exponential.fi | Covered | *A-F risk grades across chain, protocol, asset, and pool dimensions. Backtested against historical exploits.* | Lido staking pool risk rating. | 2026-04-15 |
| DeFi Safety | Covered | *Process Quality Reviews (PQR) scoring documentation, testing, security practices 0-100.* | Lido PQR review. Multiple audits noted. | 2026-04-15 |
| LlamaRisk | Partial | *Aave-funded independent risk service provider. Per-asset and per-protocol deep-dive research with governance proposal analysis.* | stETH risk analysis in context of Aave collateral. | 2026-04-15 |
| Credora | Partial | *Institutional-grade credit risk ratings for DeFi protocols and borrowers. Covers Morpho vaults and SparkLend.* | stETH derivative token risk rating. | 2026-04-15 |

**Audit History table:**

| Firm | Date | Report |
|---|---|---|
| MixBytes | 2021-04 | View → |
| Quantstamp | 2022-05 | View → |

**Incident History:** empty state — *"No known incidents on record."*

**Page footer:** *"See something wrong? This data is open source. Submit a correction on GitHub."*

---

### Screen 3 — Methodology page

![EF POC Screen 3 — Methodology page (covers both methodology + feed registry sections as one long scroll)](poc-screenshots/methodology.png)

> **Note:** Screens 3 and 4 below are rendered as a single scrolling page in the POC; the `methodology.png` screenshot above shows both methodology blocks and the full feed registry / provenance / contribute sections in one frame.

**The Oracle Analogy** (highlighted purple box):

> No single price feed is canonical. A well-designed oracle aggregates many feeds to produce one trusted value, with no individual source treated as authoritative. The aggregation is the value.
>
> The same principle applies to DeFi risk. **OpenRisk is the aggregation layer that doesn't exist yet** — a neutral place to see what every risk feed says about a protocol, side by side, with sources intact.

**What OpenRisk Does Not Do** (red box):

- OpenRisk does not assign its own risk scores.
- OpenRisk does not weight or rank risk feeds against each other.
- OpenRisk does not tell you whether a protocol is safe or unsafe.
- OpenRisk does not endorse any protocol listed.

**What OpenRisk Does Do** (green box):

- Aggregates risk feed coverage for DeFi protocols in one place.
- Surfaces governance data from onchain sources (Safe API) and verifiable registries.
- Tracks which feeds have — and have not — assessed a protocol.
- Links directly to source assessments. Ratings are shown verbatim, never normalized.
- Maintains an open, community-correctable data registry via GitHub.

**Coverage Gaps as Data** (gray box):

> A protocol that has not been assessed by any risk feed is itself a signal. The absence of coverage is information. A newer protocol with 2 feeds covering it is a meaningfully different risk profile from an established one with 15. OpenRisk makes these gaps visible rather than hiding them behind a composite number.

---

### Screen 4 — Feed Registry & contribution

**The Feed Registry** — *"Full list of all 17 providers OpenRisk aggregates from. Each feed has its own methodology and focus. We do not rank them."*

| Provider | Type | Focus |
|---|---|---|
| DeFiPunk'd | Rating | Multi-dimension risk registry assessing Control, Ability to Exit, Autonomy, Open Access, and Verifiability via distributed LLM consensus. |
| BlockAnalitica | Dashboard | Quantitative on-chain risk dashboards for lending markets, tracking liquidations, collateral health, and market exposure. |
| DeFiScan | Rating | Decentralization maturity framework assessing who controls the keys, upgrades, and admin powers. |
| CuratorWatch | Dashboard | Vault-level risk monitoring for Morpho curators, tracking allocation risk and curator behavior. |
| Pharos | Monitoring | Real-time risk monitoring and automated alerts for live protocol risk events. |
| DeFi Sphere | Rating | Multi-dimensional protocol analysis covering technical, financial, and operational risk. |
| DeFi Saver | Dashboard | Live loan health and liquidation statistics for leveraged DeFi positions. |
| Xerberus | Rating | On-chain, evidence-based risk ratings for assets, protocols, and organisations. Every subscore references a real historical incident. |
| Chronicle | Verification | Transparent, verifiable oracle feeds with Schnorr-aggregated signatures and end-to-end data traceability. |
| Accountable | Verification | Zero-knowledge proof attestation for real-time proof of reserves and NAV verification. |
| Anticapture | Analysis | Tracks hostile takeover risk, token concentration, delegate activity, and governance resilience across major DAOs. |
| Exponential.fi | Rating | A-F risk grades across chain, protocol, asset, and pool dimensions. Backtested against historical exploits. |
| LlamaRisk | Analysis | Aave-funded independent risk service provider. Per-asset and per-protocol deep-dive research with governance proposal analysis. |
| Chaos Labs | Dashboard | Edge Risk Oracles providing real-time parameter automation. Active on Aave, GMX, Pendle. |
| Gauntlet | Analysis | Agent-based simulations for insolvency prevention, parameter optimization, and risk scenario analysis. |
| DeFi Safety | Rating | Process Quality Reviews (PQR) scoring documentation, testing, security practices 0-100. |
| Credora | Rating | Institutional-grade credit risk ratings for DeFi protocols and borrowers. Covers Morpho vaults and SparkLend. |

**Data Provenance** — *"Every data point on OpenRisk carries a source tag:"*

- `[onchain]` — fetched directly from chain or a verified onchain source (Safe API, etc.)
- `[feed]` — sourced from a feed provider's published assessment
- `[curated]` — manually researched and added by a human curator via PR
- `[self-reported]` — provided by the protocol team directly

> Governance data is fetched live from the Safe API where possible, so multisig thresholds and signer counts reflect current on-chain state rather than stale YAML entries.

**How to Contribute** — *"All OpenRisk data is open source. Anyone can propose:"*

- **Corrections** — open a GitHub issue or drop a JSON file in `data/overlays/` and open a PR
- **New protocols** — PR adding a YAML file to `data/protocols/`
- **New feeds** — PR adding an entry to `data/feeds/feeds.yaml` and updating `FeedKey` type

Footer link: `github.com/cpstl/openrisk →`

---

### Observations for our mockup work

- Working brand in their mock = **OpenRisk** (not Relatum). They don't expect applicants to use it — they say "shortlisted applicants will receive GitHub access to the underlying codebase," implying the brand is whatever the codebase ships with.
- They commit to specific numbers: **17 providers, 26 protocols, 20 dashboard entries (4 grouped families).** The intro paragraph wording is a tight template — worth mirroring.
- Three core typographic primitives across the whole UI: provenance tags (`[onchain]`, `[feed]`, `[curated]`, `[self-reported]`), coverage pills (`Covered` green / `Partial` yellow / `—` no coverage), and verbatim ratings (`Stage 0`, `A`, `5/7 · 3d`).
- "No own score" is repeated in 4+ places (intro, methodology box, registry blurb, gap section). Reviewers will check whether our mock has *any* composite number anywhere — keep it pure.
- Family grouping (`▶ Aave (3 versions)`) is a real UX choice — they're showing they've thought about Aave v2 / v3 / GHO as one entity. Worth keeping.
- Footer CTA on every page: *"Submit a correction on GitHub."* Community-correctable is positioned as a UX element, not a backend choice.

---

*The Ethereum Foundation reserves the right to fund none, one, or multiple proposals, to negotiate scope, and to request revisions before award. This RFP does not constitute a commitment to fund. A public good initiative of the Ethereum Foundation App Relations team.*
