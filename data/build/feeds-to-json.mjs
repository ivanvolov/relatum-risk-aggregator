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
  return {
    covered: true,
    inline: hasStage ? `Stage ${chain.stage}` : null,
    deeplink: `https://defiscan.info/projects/${deployment.defiscan_slug}/${chain.name}`,
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

// Per-feed normalizers. Register one when a feed's adapter output should drive the UI.
const NORMALIZERS = {
  defiscan: defiscanRow,
  xerberus: xerberusRow,
  curatorwatch: curatorwatchRow,
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
    protocols[proto.slug] = normalize(proto.slug, rowForSlug(raw, proto.slug));
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
