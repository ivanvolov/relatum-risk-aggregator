# Manual inspection queue

100 / 345 cells covered. Of the 245 uncovered, **228 are structurally final** (the source has been enumerated and the protocol genuinely isn't there) and **17 are worth a human eyeball** because the seed (`ontology/seeds/coverage-seed.yaml`) suggests data should exist or it lives behind a login we can't access.

This file is just the 17 cells worth checking.

---

## Structural state (no action required)

The reasons below are all verified against the live source on 2026-06-21. The numbers do not change without a product change from the source.

| Feed | Covered | Why the rest is structurally absent |
|---|---:|---|
| DeFiScan | 11/23 | GitHub registry has exactly 29 protocols; 12 of ours aren't in it. |
| DeFiPunk'd | 13/23 | API probed all 10 remaining slugs → 0/5 slices each. |
| Xerberus | 11/23 | Dendrogram registry enumerates 42 protocols; 12 of ours aren't there. |
| pigi.finance | 10/23 | 43 strategies listed; the 13 not covered (mostly dexes/swap aggregators) don't have pigi strategies. |
| Zyfai | 7/23 | API returns 7 protocols across 3 chains; rest aren't in their pool index. |
| Block Analitica | 4/23 | Each dashboard is its own subdomain; the 19 not covered have no `<protocol>-api.blockanalitica.com`. |
| CuratorWatch | 5/23 | Probed `curatorwatch.com/<slug>` for the 18 misses; all 404. |
| DeFi Sphere | 5/23 | Sidebar API enumerates 5 protocols; that's the whole universe. |
| Stablewatch | 5/23 | Live API has 94 assets across ~60 issuers; only 5 of our 23 issue YB-stables they index. |
| Pharos | **8/23** | Sitemap scanned — 8 of our protocols issue stables they classify. Yearn just recovered. |
| DeFi Saver | 9/23 | Marketing-page scrape + app bundle scan; the 14 not covered aren't on either surface. |
| Philidor | 3/23 | No public API; landing page lists 9 protocols, 3 of ours are canonical Philidor coverage. |
| RiskLayer | 0/23 | Product pivoted away from DeFi. Confirmed via site copy. |

That leaves Credora + LlamaRisk below as the only feeds with addressable gaps we can't reach automatically.

---

## ⚠ Worth checking manually — 17 cells

### Credora — 4 cells

Public XML index at `https://reports.credora.io/index.xml` only enumerates 4 protocols (spark, listadao, lotus, steth). The seed promises more — likely behind `app.credora.io` (login required).

| Protocol | Seed | What to check |
|---|---|---|
| `sky` | part | Open `app.credora.io` while logged in; search for "Sky" / "USDS" / "MakerDAO". Paste any rating-page URL back here. |
| `ethena` | cov | Same — check for "Ethena" / "USDe". |
| `etherfi` | part | Same — check for "ether.fi" / "eETH" / "weETH". |
| `morpho` | cov | Same — check for "Morpho" markets/vaults. |

### LlamaRisk — 5 high-confidence cells

Adapter scans `llamarisk.substack.com` (87 posts; 0 hits for these protocols). LlamaRisk also publishes on governance forums — `data/adapters/llamarisk/adapter.mjs:16-19` flags this. The seed marked these as `cov`, so a deliverable likely exists somewhere.

| Protocol | Where to look |
|---|---|
| `compound` | https://www.comp.xyz/ — search "LlamaRisk" in tags or author. |
| `lido` | https://research.lido.fi/ — LlamaRisk has a long history of Lido posts. |
| `spark` | https://forum.sky.money/ (Spark is Sky's lending arm) — search "LlamaRisk". |
| `pendle` | https://research.pendle.finance/ or their Discord — look for risk-vendor commentary. |
| `yearn` | https://gov.yearn.fi/ — search "LlamaRisk". |

### LlamaRisk — 8 lower-confidence cells

Seed marked these as `part`. If you find a single canonical post per protocol, paste the URL; otherwise we keep the gap.

`balancer` · `etherfi` · `euler` · `fluid` · `gearbox` · `rocketpool` · `uniswap`

Sources to grep: each protocol's governance forum, plus `https://research.llamarisk.com` (dashboard, gated).

---

## How to resolve

For each cell you confirm: paste the canonical URL here under the protocol line and ping me. I'll either extend the corresponding adapter (preferred — the URL becomes auto-detected next snapshot) or add a one-off override in the adapter's manual-links table.
