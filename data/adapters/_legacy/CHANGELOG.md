# Adapter fetch run — 2026-06-16

One-shot WebFetch grab of public risk-feed data for 5 protocols across all 15 feeds. **Not a continuous adapter** — values frozen at this date; re-running this script is a future M2 deliverable.

Method: WebFetch only (no JS execution, no auth). Where pages were JS-rendered SPAs, only methodology-level scope is recorded (status = `part`). Data is hand-curated into `data.js` under `PROTOCOL_DETAILS`.

## Summary matrix

Legend: `C` = covered with concrete data points · `P` = scope confirmed but data SPA-rendered · `N` = not tracked · `G` = gated (needs auth)

| Feed           | Morpho | Sky | Spark | Compound | Ethena |
|----------------|:-:|:-:|:-:|:-:|:-:|
| DeFiScan       | C | C | C | C | C |
| BlockAnalitica | P | P | P | P | P |
| CuratorWatch   | C | C | C | P | N |
| DeFiPunk'd     | G | G | G | G | G |
| Pharos         | N | C | N | N | C |
| DeFi Sphere    | P | N | P | P | N |
| DeFi Saver     | P | N | P | P | N |
| Credora        | P | N | P | N | N |
| RiskLayer      | C | N | C | C | C |
| pigi.finance   | P | N | C | N | C |
| Xerberus       | P | P | P | P | P |
| Zyfai Risk     | P | P | P | P | P |
| LlamaRisk      | N | N | N | N | C |
| Philidor       | P | N | P | P | N |
| StableWatch    | N | C | C | N | C |

Tally:
- aave: cov=6, part=5, none=4 (already done before this run)
- morpho: cov=3, part=8, none=4
- sky: cov=4, part=3, none=8
- spark: cov=5, part=7, none=3
- compound: cov=2, part=7, none=6
- ethena: cov=6, part=3, none=6

## Source URL patterns discovered

| Feed | Pattern | Notes |
|---|---|---|
| DeFiScan | `defiscan.info/protocols/<slug>/<chain>` | The site is SPA; canonical text lives at `raw.githubusercontent.com/deficollective/defiscan/main/src/content/protocols/<slug>/<chain>.md`. Use the raw .md for reliable parsing. |
| BlockAnalitica | `<slug>.blockanalitica.com` | Subdomain per protocol; bodies JS-rendered. Sky's variant is `info.skyeco.com` (via 301 from `info.sky.money`). |
| CuratorWatch | `curatorwatch.com` (home) | Home is server-rendered with curator leaderboard; `/protocols/<slug>` and `/curators/<x>` SPA-404 server-side. |
| DeFiPunk'd | unknown | Homepage HTML > 10MB. All slug guesses (`/protocols/<x>`, `/<x>`, `/p/<x>`, `/scores`) 404. **Needs maintainer guidance.** |
| Pharos | `pharos.watch/stablecoin/<token>-<issuer>` | Confirmed slugs: `usds-sky`, `usde-ethena`. `gho-aave` worked previously. `dai-sky` and `susds-spark` returned 404. |
| DeFi Sphere | `defi-sphere.com` (home) | Landing names 5 supported protocols. App at `app.defi-sphere.com` gated/SPA. |
| DeFi Saver | `app.defisaver.com/<slug>` | Route existence confirms integration; values SPA-rendered. |
| Credora | `credora.network` (home) + `app.credora.network` (app) | Home shows partner logos. App gated. |
| RiskLayer | `risklayer.online` (home) | Home shows 12-protocol leaderboard with 0–10 scores, server-rendered. No `/protocol/<slug>` route. |
| pigi.finance | `pigi.finance/featured/<slug>` | Featured-strategy cards. SPA-rendered values; methodology text server-rendered. Confirmed: `morpho`, `ethena`, `sky-spark`. |
| Xerberus | `xerberus.io` (home) + `app.xerberus.io` (terminal) | Terminal gated/SPA. |
| Zyfai | `risk.zyf.ai` | Pure SPA. Docs at `docs.zyf.ai` 404. |
| LlamaRisk | `llamarisk.com/research` (research feed) + `dashboard.llamarisk.com/risk-intelligence` | Research feed scrapable. Dashboard SPA. |
| Philidor | `analytics.philidor.io/vaults?protocol=<slug>` | Filter route SPA; vault rows JS-rendered. Methodology at `docs.philidor.io` (server-rendered). |
| StableWatch | `stablewatch.io/analytics/assets/<token>-<issuer>` | Direct fetches 403 (Cloudflare). Confirmed slugs (via Google index): `sUSDS-Sky`, `USDe-Ethena`. |

## Needs user help

1. **DeFiPunk'd** — URL pattern. Highest priority since it's 0/5 on this run.
2. **Pharos slug list** — `dai-sky` and `susds-spark` returned 404; need the canonical slug map.
3. **Credora app login** — Spark, Morpho, Lido confirmed as partners but ratings live behind auth.
4. **Xerberus terminal** — Morpho confirmed as rated; numeric score behind terminal auth.
5. **StableWatch deep pages** — Cloudflare-blocking direct WebFetch; needs browser-session screenshots or public JSON API.
6. **Block Analitica JS dashboards** — `<protocol>.blockanalitica.com` subdomains return title-only HTML.
7. **DeFi Sphere app** — gated; per-protocol risk scores not extractable.
8. **Philidor vault scores** — per-vault 0–10 scores SPA-rendered.

## Re-running this fetch

This was a one-shot grab; the proposal commits to building real per-feed adapters in W3–W9. To re-grab against this same set of 25 cells, the next iteration would:

1. Replace WebFetch with headless browser (Playwright) for SPA pages.
2. Use feed-specific APIs where they exist: Philidor REST + MCP, Pharos public API.
3. For gated feeds (Credora, Xerberus, DeFi Sphere), reach out for read-only API keys.
4. Emit Turtle triples (`data/rdf/<slug>.<feed>.ttl`) instead of inlining into `data.js`.

For now `data.js#PROTOCOL_DETAILS` is the source of truth for these 5 protocols' detail pages.
