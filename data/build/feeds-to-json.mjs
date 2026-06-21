// Per-feed normalization: scrape JSON → public/data/feeds/<feedId>.json.
// Each feed has a normalizer that turns its raw adapter output into a uniform
// per-protocol record: { covered, inline?, claims?, observedAt?, deeplink?, reason? }.
// The presence of public/data/feeds/<feedId>.json is what flips adapterStatus to "implemented"
// (replacing the existsSync(to-ttl.mjs) check from the TTL pipeline).

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FEED_REGISTRY, PROTOCOLS } from './lib/registry.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ADAPTERS = path.join(ROOT, 'data', 'adapters');
const FEEDS_OUT = path.join(ROOT, 'public', 'data', 'feeds');

// DeFiScan's 5-axis risk array order (defiscan.info/framework).
const DEFISCAN_RISK_AXES = ['chain', 'upgradeability', 'autonomy', 'exit-window', 'accessibility'];

// Pick the Ethereum chain if present; else first available. Keeps rendering verbatim per chain.
function pickPrimaryChain(deployment) {
  if (!deployment?.chains) return null;
  if (deployment.chains.ethereum) return { name: 'ethereum', ...deployment.chains.ethereum };
  const [name, payload] = Object.entries(deployment.chains)[0] ?? [];
  return name ? { name, ...payload } : null;
}

function defiscanRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return {
      covered: false,
      reason: raw?.reason ?? 'not in DeFiScan registry',
      deeplink: null,
    };
  }
  const deployment = raw.deployments?.[0];
  const chain = pickPrimaryChain(deployment);
  if (!chain) {
    return { covered: false, reason: 'no chain payload', deeplink: null };
  }
  const hasStage = chain.stage !== null && chain.stage !== undefined;
  const claims = [];
  if (hasStage) claims.push({ dim: 'stage', value: String(chain.stage), scale: 'Stage 0..2' });
  (chain.risks || []).forEach((value, i) => {
    const dim = DEFISCAN_RISK_AXES[i];
    if (dim) claims.push({ dim, value, scale: 'L/M/H' });
  });
  // DeFiScan migrated from /projects/<slug>/<chain> to /protocol/<slug> where <slug>
  // is the first defillama_slug (e.g. "aave-v3", "morpho-blue", "sky-lending"). Fall
  // back to defiscan_slug if defillama_slug is absent.
  const urlSlug = deployment.defillama_slug?.[0] ?? deployment.defiscan_slug;
  return {
    covered: true,
    inline: hasStage ? `Stage ${chain.stage}` : null,
    deeplink: `https://www.defiscan.info/protocol/${urlSlug}`,
    observedAt: chain.publish_date ?? null,
    primaryChain: chain.name,
    deploymentName: deployment.name,
    claims,
  };
}

// Xerberus: composite (0..1) + 5 domain subscores per protocol version.
// We pick the first version (adapters that find multiple deployments still record
// one composite per version — the first-listed is the largest/canonical one).
const XERBERUS_DOMAINS = ['security', 'economics', 'governance', 'receipt_tokens', 'cross_chain'];

function xerberusRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return {
      covered: false,
      reason: raw?.reason ?? 'not in Xerberus dendrogram',
      deeplink: null,
    };
  }
  const version = raw.versions?.[0];
  if (!version) {
    return { covered: false, reason: 'no version payload', deeplink: null };
  }
  const composite = version.composite_score;
  const claims = [
    { dim: 'composite', value: composite != null ? composite.toFixed(3) : '—', scale: '0..1' },
  ];
  const ds = version.domain_scores || {};
  for (const d of XERBERUS_DOMAINS) {
    const v = ds[d];
    claims.push({ dim: d, value: v != null ? v.toFixed(3) : '—', scale: '0..1' });
  }
  return {
    covered: true,
    inline: composite != null ? composite.toFixed(2) : null,
    deeplink: version.website ?? null,
    observedAt: null,
    deploymentName: version.name ?? null,
    claims,
  };
}

// CuratorWatch: per-protocol curated Morpho/Aave/Euler/Compound vault stats.
// Inline = vault_count ("N vaults"). Claims = vault_count, total_tvl_usd, grade distribution.
const fmtUsdShort = (n) => {
  if (n == null) return '—';
  if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

function curatorwatchRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return {
      covered: false,
      reason: raw?.reason ?? 'not a lending rail curated on CuratorWatch',
      deeplink: null,
    };
  }
  const grades = raw.grade_distribution || {};
  const gradeSummary = Object.entries(grades)
    .map(([k, v]) => `${v}× ${k}`)
    .join(', ');
  const curators = (raw.curators || []).filter(Boolean);
  const claims = [
    { dim: 'vaults', value: String(raw.vault_count ?? '—'), scale: 'count' },
    { dim: 'tvl', value: fmtUsdShort(raw.total_tvl_usd), scale: 'USD' },
    { dim: 'grade-distribution', value: gradeSummary || '—', scale: 'CuratorWatch grade' },
    { dim: 'curator-count', value: String(curators.length), scale: 'count' },
  ];
  return {
    covered: true,
    inline: raw.vault_count != null ? `${raw.vault_count} vaults` : null,
    deeplink: `https://curatorwatch.com/${slug}`,
    observedAt: null,
    claims,
  };
}

// Pharos: enumerates the protocol's stablecoins with deeplinks to each Pharos page.
// Inline = "N stables". Claims = count + one per-stablecoin row pointing at its Pharos URL.
function pharosRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return {
      covered: false,
      reason: raw?.reason ?? 'no Pharos-tracked stablecoins for this protocol',
      deeplink: null,
    };
  }
  const stables = raw.stablecoins || [];
  const claims = [
    { dim: 'stablecoin-count', value: String(raw.stablecoin_count ?? stables.length), scale: 'count' },
  ];
  for (const s of stables) {
    claims.push({ dim: 'stablecoin', value: s.slug, scale: 'pharos page', url: s.page });
  }
  return {
    covered: true,
    inline: `${raw.stablecoin_count ?? stables.length} stables`,
    deeplink: stables[0]?.page ?? null,
    observedAt: null,
    claims,
  };
}

// DeFi Sphere: lending market analytics. Numeric collateral and liquidity risk per protocol.
// Their per-protocol page lives at https://app.defi-sphere.com/protocols/<slug> where <slug>
// is one of: aave_v3, compound_v3, liquity_v2, morpho, sparklend (source: their own
// /protocols/sidebar/ endpoint at sphere.data.blockanalitica.com). We map our 5 covered
// registry slugs to those; anything else falls back to the markets index.
const DEFISPHERE_SLUGS = {
  aave: 'aave_v3',
  spark: 'sparklend',
  morpho: 'morpho',
  compound: 'compound_v3',
  liquity: 'liquity_v2',
};
function defisphereRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'no DeFi Sphere lending market for this protocol', deeplink: null };
  }
  const claims = [
    { dim: 'markets', value: String(raw.market_count ?? '—'), scale: 'count' },
    { dim: 'total-supply', value: fmtUsdShort(raw.total_supply_usd), scale: 'USD' },
    { dim: 'total-borrow', value: fmtUsdShort(raw.total_borrow_usd), scale: 'USD' },
    { dim: 'avg-collateral-risk', value: raw.avg_collateral_risk != null ? raw.avg_collateral_risk.toFixed(2) : '—', scale: 'DeFi Sphere risk' },
    { dim: 'avg-liquidity-risk', value: raw.avg_liquidity_risk != null ? raw.avg_liquidity_risk.toFixed(2) : '—', scale: 'DeFi Sphere risk' },
    { dim: 'networks', value: (raw.networks || []).join(', ') || '—', scale: 'chains' },
  ];
  const sphereSlug = DEFISPHERE_SLUGS[slug];
  const deeplink = sphereSlug
    ? `https://app.defi-sphere.com/protocols/${sphereSlug}`
    : 'https://app.defi-sphere.com/markets';
  return {
    covered: true,
    inline: raw.market_count != null ? `${raw.market_count} markets` : null,
    deeplink,
    observedAt: null,
    claims,
  };
}

// DeFi Saver: per-protocol surfaces (lending / dex / leverage) from feature pages
// + per-protocol market count from the public app bundle (distinct /manage routes).
// Matrix inline = "N markets" when count > 0; covered protocols without bundle
// routes (curve/fluid/euler — different routing convention) just show ✓.
function defisaverRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'not a DeFi Saver execution surface', deeplink: null };
  }
  const surfaces = raw.surfaces || [];
  const markets = raw.markets || [];
  const claims = [];
  if (markets.length) {
    claims.push({ dim: 'markets', value: String(markets.length), scale: 'distinct /manage routes in app bundle' });
  }
  claims.push({ dim: 'surfaces', value: surfaces.join(', '), scale: 'DeFi Saver flow' });
  for (const m of markets.slice(0, 8)) {
    claims.push({ dim: 'market', value: m, scale: 'app route' });
  }
  return {
    covered: true,
    inline: markets.length ? `${markets.length} markets` : 'supported',
    deeplink: 'https://app.defisaver.com',
    observedAt: null,
    claims,
  };
}

// Stablewatch: per-asset TVL of yield-bearing stables this protocol is the issuer of.
function stablewatchRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'no Stablewatch-tracked yield-bearing assets', deeplink: null };
  }
  const assets = raw.assets || [];
  const claims = [
    { dim: 'asset-count', value: String(raw.asset_count ?? assets.length), scale: 'count' },
    { dim: 'total-tvl', value: fmtUsdShort(raw.total_tvl), scale: 'USD' },
  ];
  for (const a of assets) {
    claims.push({ dim: 'asset', value: a.asset, scale: `TVL ${fmtUsdShort(a.tvl_current)}`, url: a.address ? `https://etherscan.io/address/${a.address}` : null });
  }
  return {
    covered: true,
    inline: `${raw.asset_count ?? assets.length} stables · ${fmtUsdShort(raw.total_tvl)}`,
    deeplink: 'https://stablewatch.io',
    observedAt: null,
    claims,
  };
}

// Block Analitica: live on-chain stats per lending protocol (supply, borrow, utilization).
function blockanaliticaRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'no Block Analitica dashboard for this protocol', deeplink: null };
  }
  // Stats are nested: raw.stats.stats.* — strings (decimal-as-string)
  const stats = raw.stats?.stats || {};
  const toNum = (s) => s != null ? Number(s) : null;
  const supply = toNum(stats.supply);
  const borrow = toNum(stats.borrow);
  const tvl = toNum(stats.tvl);
  const claims = [
    { dim: 'supply', value: fmtUsdShort(supply), scale: 'USD' },
    { dim: 'borrow', value: fmtUsdShort(borrow), scale: 'USD' },
    { dim: 'tvl', value: fmtUsdShort(tvl), scale: 'USD' },
  ];
  if (supply && borrow) {
    claims.push({ dim: 'utilization', value: `${((borrow/supply)*100).toFixed(1)}%`, scale: '%' });
  }
  return {
    covered: true,
    inline: fmtUsdShort(tvl ?? supply),
    deeplink: raw.stats_url ?? 'https://blockanalitica.com',
    observedAt: null,
    claims,
  };
}

// DeFiPunk'd: 5-principle consensus grades (verifiability, control, ability-to-exit, autonomy, open-access).
// Snapshot is keyed by defipunkd's own slugs — we map them here. When multiple defipunkd slugs
// fit one of ours (e.g. curve-dex / curve-llamalend / crvusd), pick the one with the most filled slices.
const DEFIPUNKD_SLUG_MAP = {
  'sky':        'sky-lending',
  'spark':      'sparklend',
  'morpho':     'morpho-blue',
  'ethena':     'ethena-usde',
  'aave':       'aave-v3',
  'lido':       'lido',
  'liquity':    'liquity-v1',
  'rocketpool': 'rocket-pool',
  'uniswap':    'uniswap-v4',
  'curve':      'curve-dex',
  'etherfi':    'ether.fi-stake',
  'pendle':     'pendle',
  'balancer':   'balancer-v3',
};
const DEFIPUNKD_PRINCIPLES = ['verifiability', 'control', 'ability-to-exit', 'autonomy', 'open-access'];

function defipunkdRow(slug, row, raw) {
  const apiKey = DEFIPUNKD_SLUG_MAP[slug];
  const apiRow = apiKey ? raw?.[apiKey] : null;
  if (!apiRow) {
    return { covered: false, reason: 'not in DeFiPunk\'d assessment set', deeplink: null };
  }
  const slices = apiRow.slices || {};
  const claims = [];
  let greens = 0;
  for (const p of DEFIPUNKD_PRINCIPLES) {
    const s = slices[p];
    if (!s) continue;
    if (s.consensus_grade === 'green') greens++;
    claims.push({
      dim: p,
      value: `${s.consensus_grade ?? '—'} (${s.consensus_strength ?? '—'})`,
      scale: 'DeFiPunk\'d grade',
    });
    if (s.short_headline) {
      claims.push({ dim: `${p}-headline`, value: s.short_headline, scale: 'headline' });
    }
  }
  return {
    covered: true,
    inline: `${greens}/5 green`,
    deeplink: `https://defipunkd.com/protocol/${apiKey}`,
    observedAt: null,
    claims,
  };
}

// Credora: list of published institutional credit reports (PDF links).
function credoraRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'not in Credora public reports index', deeplink: null };
  }
  const reports = raw.reports || [];
  const claims = [
    { dim: 'report-count', value: String(raw.report_count ?? reports.length), scale: 'count' },
    { dim: 'latest-report', value: raw.latest_report_date ?? '—', scale: 'ISO date' },
  ];
  for (const r of reports) {
    claims.push({ dim: 'report', value: r.filename ?? r.date, scale: 'PDF', url: r.url });
  }
  return {
    covered: true,
    inline: `${raw.report_count ?? reports.length} reports`,
    deeplink: reports[0]?.url ?? 'https://credora.network',
    observedAt: raw.latest_report_date ?? null,
    claims,
  };
}

// LlamaRisk: long-form research posts mentioning this protocol on Substack.
function llamariskRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'no LlamaRisk research posts for this protocol', deeplink: null };
  }
  const posts = raw.posts || [];
  const claims = [
    { dim: 'post-count', value: String(raw.post_count ?? posts.length), scale: 'count' },
    { dim: 'latest-post', value: raw.latest_post_date ?? '—', scale: 'ISO date' },
  ];
  for (const p of posts) {
    claims.push({ dim: 'post', value: p.title, scale: p.post_date ?? '', url: p.url });
  }
  return {
    covered: true,
    inline: `${raw.post_count ?? posts.length} posts`,
    deeplink: posts[0]?.url ?? 'https://llamarisk.com',
    observedAt: raw.latest_post_date ?? null,
    claims,
  };
}

// pigi.finance: per-protocol vault strategies with risk-adjusted yield.
function pigiRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'no pigi.finance strategy tracking for this protocol', deeplink: null };
  }
  const strategies = raw.strategies || [];
  const claims = [
    { dim: 'strategy-count', value: String(raw.strategy_count ?? strategies.length), scale: 'count' },
    { dim: 'avg-risk', value: raw.avg_risk != null ? raw.avg_risk.toFixed(2) : '—', scale: 'pigi risk 0..1' },
    { dim: 'avg-yield-30d', value: raw.avg_yield30d != null ? `${raw.avg_yield30d.toFixed(2)}%` : '—', scale: '30-day APY' },
    { dim: 'total-tvl', value: fmtUsdShort(raw.total_tvl), scale: 'USD' },
  ];
  for (const s of strategies.slice(0, 8)) {
    claims.push({ dim: 'strategy', value: s.name, scale: `risk ${s.risk ?? '—'} · yield ${s.yield30d != null ? s.yield30d.toFixed(2) + '%' : '—'}` });
  }
  return {
    covered: true,
    inline: raw.avg_risk != null ? `Risk ${raw.avg_risk.toFixed(2)}` : null,
    deeplink: 'https://pigi.finance',
    observedAt: null,
    claims,
  };
}

// Zyfai Risk: per-protocol pool opportunities with TVL and APY signals.
function zyfaiRow(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'no Zyfai-tracked pools for this protocol', deeplink: null };
  }
  const pools = raw.pools || [];
  const claims = [
    { dim: 'opportunity-count', value: String(raw.opportunity_count ?? pools.length), scale: 'count' },
    { dim: 'total-tvl', value: fmtUsdShort(raw.total_tvl), scale: 'USD' },
    { dim: 'avg-apy', value: raw.avg_apy != null ? `${(raw.avg_apy * 100).toFixed(2)}%` : '—', scale: 'APY' },
    { dim: 'chains', value: (raw.chains || []).join(', ') || '—', scale: 'chain ids' },
  ];
  for (const p of pools.slice(0, 6)) {
    claims.push({ dim: 'pool', value: `${p.protocol} · ${p.pool}`, scale: `TVL ${fmtUsdShort(p.tvl)} · APY ${(p.apy * 100).toFixed(2)}%`, url: p.url });
  }
  return {
    covered: true,
    inline: `${raw.opportunity_count ?? pools.length} pools`,
    deeplink: 'https://zyf.ai',
    observedAt: null,
    claims,
  };
}

// Philidor / RiskLayer share the same shape today: stub output, mostly covered:false.
// One normalizer reused; reason / inline / deeplink pass through from the underlying row.
function passthroughCoverageOnly(slug, raw) {
  if (!raw || raw.covered === false) {
    return { covered: false, reason: raw?.reason ?? 'adapter not yet scraped', deeplink: null };
  }
  return {
    covered: true,
    inline: raw.inline ?? 'tracked',
    deeplink: raw.deeplink ?? null,
    observedAt: raw.observedAt ?? null,
    claims: raw.claims ?? [],
  };
}

// Per-feed normalizers. Register one when a feed's adapter output should drive the UI.
const NORMALIZERS = {
  defiscan: defiscanRow,
  xerberus: xerberusRow,
  curatorwatch: curatorwatchRow,
  pharos: pharosRow,
  defisphere: defisphereRow,
  defisaver: defisaverRow,
  stablewatch: stablewatchRow,
  blockanalitica: blockanaliticaRow,
  defipunkd: defipunkdRow,
  credora: credoraRow,
  llamarisk: llamariskRow,
  pigi: pigiRow,
  zyfai: zyfaiRow,
  philidor: passthroughCoverageOnly,
  risklayer: passthroughCoverageOnly,
};

async function latestOutputFile(feedId) {
  const outDir = path.join(ADAPTERS, feedId, 'output');
  if (!existsSync(outDir)) return null;
  const files = (await readdir(outDir)).filter(n => n.endsWith('.json')).sort();
  if (!files.length) return null;
  return path.join(outDir, files[files.length - 1]);
}

// Some adapters write {summary, protocols: {<slug>: {...}}}; others write the flat
// {<slug>: {...}}. Resolve transparently so normalizers don't repeat the dance.
const rowForSlug = (raw, slug) => raw?.[slug] ?? raw?.protocols?.[slug] ?? null;

async function normalizeFeed(feed) {
  const normalize = NORMALIZERS[feed.id];
  if (!normalize) return null;
  const sourceFile = await latestOutputFile(feed.id);
  if (!sourceFile) return null;
  const raw = JSON.parse(await readFile(sourceFile, 'utf8'));
  const snapshotDate = path.basename(sourceFile, '.json');
  const protocols = {};
  for (const proto of PROTOCOLS) {
    // Third arg gives normalizers that need cross-protocol lookup (e.g. defipunkd's slug map)
    // access to the raw file. Other normalizers just take the resolved row.
    protocols[proto.slug] = normalize(proto.slug, rowForSlug(raw, proto.slug), raw);
  }
  return {
    feedId: feed.id,
    feedName: feed.name,
    generatedAt: new Date().toISOString(),
    snapshotDate,
    sourceFile: `data/adapters/${feed.id}/output/${path.basename(sourceFile)}`,
    protocols,
  };
}

export async function run() {
  await mkdir(FEEDS_OUT, { recursive: true });
  let written = 0;
  for (const feed of FEED_REGISTRY) {
    const norm = await normalizeFeed(feed);
    if (!norm) {
      console.log(`  skip ${feed.id} (no normalizer or no output)`);
      continue;
    }
    const outPath = path.join(FEEDS_OUT, `${feed.id}.json`);
    await writeFile(outPath, JSON.stringify(norm, null, 2));
    const covered = Object.values(norm.protocols).filter(p => p.covered).length;
    console.log(`  wrote feeds/${feed.id}.json  (covered ${covered}/${PROTOCOLS.length})`);
    written++;
  }
  return written;
}

import { fileURLToPath } from 'node:url';
if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('feeds-to-json');
  const n = await run();
  console.log(`done — ${n} feed JSON(s) emitted`);
}
