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

// Per-feed normalizers. Register one when a feed's adapter output should drive the UI.
const NORMALIZERS = {
  defiscan: defiscanRow,
};

async function latestOutputFile(feedId) {
  const outDir = path.join(ADAPTERS, feedId, 'output');
  if (!existsSync(outDir)) return null;
  const files = (await readdir(outDir)).filter(n => n.endsWith('.json')).sort();
  if (!files.length) return null;
  return path.join(outDir, files[files.length - 1]);
}

async function normalizeFeed(feed) {
  const normalize = NORMALIZERS[feed.id];
  if (!normalize) return null;
  const sourceFile = await latestOutputFile(feed.id);
  if (!sourceFile) return null;
  const raw = JSON.parse(await readFile(sourceFile, 'utf8'));
  const snapshotDate = path.basename(sourceFile, '.json');
  const protocols = {};
  for (const proto of PROTOCOLS) {
    protocols[proto.slug] = normalize(proto.slug, raw[proto.slug]);
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
