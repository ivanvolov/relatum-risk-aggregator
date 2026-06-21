# Manual inspection queue

Cells where the gap-closing pass couldn't recover coverage through public sources, but the seed (`data/seeds/coverage-seed.yaml`) or other signals suggest coverage might exist. Each entry lists what was tried and where to look manually. After confirming/refuting, either supply a working source URL (we'll extend the adapter) or confirm the gap and we'll tighten the `reason`.

---

## Credora

The public XML index at `https://reports.credora.io/index.xml` only enumerates 4 protocols (spark, listadao, lotus, steth). The seed promises additional coverage that likely lives behind `app.credora.io` (login required) or in the methodology pages — not in the public reports archive.

- **sky** (seed: `part`) — Sky/MakerDAO has had Credora attention historically. Check `app.credora.io` for a sky/usds rating page, or search Credora's blog/methodology for Sky. If a public artifact exists, paste the URL here.
- **ethena** (seed: `cov`) — Ethena USDe. Check Credora's app or any published rating PDF. The XML index has 0 hits for ethena/usde.
- **etherfi** (seed: `part`) — ether.fi/eETH. Same — check the app or published research.
- **morpho** (seed: `cov`) — Morpho Blue/markets. The app may carry vault-level Credora ratings.

---

## LlamaRisk

Adapter scans `llamarisk.substack.com` (87 posts as of 2026-06-17). Fresh re-fetch on 2026-06-20 confirms no new posts. LlamaRisk also publishes on governance forums (Aave, Compound, Lido, Spark) which the adapter explicitly notes it can't see (`data/adapters/llamarisk/adapter.mjs:16-19`). Seed-promised cells below are likely sourced from forum posts, not Substack.

- **compound** (seed: `cov`) — Substack has 0 hits for `\bcompound\b|\bcUSDC\b`. Likely on https://governance.compound.finance/ or similar. If you have a canonical LlamaRisk-on-Compound deliverable URL, paste it.
- **lido** (seed: `cov`) — Substack has 0 hits for `\blido\b|\bstETH\b|\bwstETH\b`. Likely on https://research.lido.fi/. LlamaRisk has a long history here.
- **spark** (seed: `cov`) — Substack has 0 hits for `\bspark\b|\bsDAI\b`. Likely on https://forum.sky.money/ or via Sky's risk vendor selection process.
- **pendle** (seed: `cov`) — Substack has 0 hits. Maybe on https://research.pendle.finance/.
- **yearn** (seed: `cov`) — Substack has 0 hits for `\byearn\b|\byv[A-Z]+\b/`. Yearn has its own gov forum.
- **balancer, etherfi, fluid, gearbox, rocketpool, uniswap** (seed: `part`) — Substack has 0 hits. Same caveat — likely scattered governance-forum work. Confirm or skip if too minor.

Action option: if you confirm forum URLs are the right source, we can extend the adapter to also scrape a list of governance forum permalinks (or simply curate a `MANUAL_LLAMARISK_LINKS` map in the adapter and mark them covered with the canonical deliverable URL).
