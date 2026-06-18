// For every protocol in the registry, emit data/out/protocols/<slug>.json.
// Reads:
//   - data/ontology/protocols/<ontologyDir>/combined.ttl  (optional)
//   - data/ontology/protocols/<ontologyDir>/_prose.yaml   (optional overlay)
//   - data/seeds/coverage-seed.yaml                       (fallback per-feed status)
//   - data/adapters/<feed>/to-ttl.mjs (existence checked) (sets adapterStatus)
// Writes:
//   - data/out/protocols/<slug>.json

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { loadStore, claimsByFeed, splitCurrentVsHistory } from './lib/ttl-load.mjs';
import { FEED_REGISTRY, PROTOCOLS, slugToOntologyDir } from './lib/registry.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ONT  = path.join(ROOT, 'data', 'ontology', 'protocols');
const ADAPTERS = path.join(ROOT, 'data', 'adapters');
const SEEDS = path.join(ROOT, 'data', 'seeds');
const OUT  = path.join(ROOT, 'public', 'data', 'protocols');

const adapterImplemented = (feedId) => existsSync(path.join(ADAPTERS, feedId, 'to-ttl.mjs'));

export async function buildProtocolJson(proto, coverageSeed) {
  const ttlDir = path.join(ONT, slugToOntologyDir(proto.slug));
  const combinedPath = path.join(ttlDir, 'combined.ttl');
  const prosePath    = path.join(ttlDir, '_prose.yaml');
  const hasTtl   = existsSync(combinedPath);
  const hasProse = existsSync(prosePath);

  const prose = hasProse ? YAML.parse(await readFile(prosePath, 'utf8')) : {};
  const byFeed = hasTtl ? claimsByFeed(await loadStore(combinedPath)) : new Map();
  const seedRow = coverageSeed[proto.slug] || {};

  const feeds = FEED_REGISTRY.map(f => {
    const feedId = f.id;
    const ttlEntry = byFeed.get(feedId) || { status: null, sourceUrl: null, observedAt: null, coverageReason: null, claims: [] };
    const overlay  = prose.feeds?.[feedId] || {};
    const adapterStatus = adapterImplemented(feedId) ? 'implemented' : 'pending';

    const inferredFromClaims = ttlEntry.claims.length > 0 ? 'cov' : null;
    const status =
      overlay.status              // explicit prose override
      ?? ttlEntry.status          // TTL CoverageStatement
      ?? inferredFromClaims       // claims exist but no CoverageStatement
      ?? seedRow[feedId]          // baseline from coverage-seed.yaml
      ?? 'none';

    const { current, history } = splitCurrentVsHistory(ttlEntry.claims);

    return {
      feedId,
      status,                                          // cov | part | none
      adapterStatus,                                   // implemented | pending
      sourceUrl: overlay.sourceUrl ?? ttlEntry.sourceUrl ?? null,
      observedAt: overlay.observedAt ?? ttlEntry.observedAt ?? null,
      methodology: overlay.methodology ?? null,
      coverageReason: overlay.coverageReason ?? ttlEntry.coverageReason ?? null,
      claims: current,
      history,
      notable: overlay.notable ?? null,
      findings: overlay.findings ?? null,
    };
  });

  // lastUpdated = newest observedAt across all feeds
  const allDates = feeds.map(f => f.observedAt).filter(Boolean).sort();
  const lastUpdated = prose.lastUpdated || (allDates.length ? allDates[allDates.length - 1] : null);

  return {
    slug: proto.slug,
    name: prose.name || proto.name,
    category: prose.category || proto.category,
    tvl_usd: prose.tvl_usd ?? proto.tvl_usd,
    family: prose.family || proto.family,
    versions: prose.versions ?? proto.versions ?? null,
    description: prose.description || null,
    lastUpdated,
    governance_summary: prose.governance_summary ?? proto.governance_summary ?? null,
    governance_degrade_note: prose.governance_degrade_note ?? null,
    inlineRating: prose.inlineRating ?? proto.inlineRating ?? {},
    sidecards: prose.sidecards ?? [],
    audit_history: prose.audit_history ?? [],
    incidents: prose.incidents ?? [],
    feeds,
  };
}

export async function run() {
  await mkdir(OUT, { recursive: true });
  const coverageSeed = YAML.parse(await readFile(path.join(SEEDS, 'coverage-seed.yaml'), 'utf8'));
  let written = 0;
  for (const proto of PROTOCOLS) {
    const json = await buildProtocolJson(proto, coverageSeed);
    const outPath = path.join(OUT, `${proto.slug}.json`);
    await writeFile(outPath, JSON.stringify(json, null, 2));
    const cov = json.feeds.filter(f => f.status === 'cov').length;
    const part = json.feeds.filter(f => f.status === 'part').length;
    const pending = json.feeds.filter(f => f.adapterStatus === 'pending').length;
    const claims = json.feeds.reduce((n, f) => n + f.claims.length, 0);
    console.log(`  ${proto.slug.padEnd(11)} cov=${cov} part=${part} pending=${pending} claims=${claims}`);
    written++;
  }
  return written;
}

import { fileURLToPath } from 'node:url';
if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('ttl-to-json (all 20 protocols)');
  const n = await run();
  console.log(`done — ${n} protocol(s) emitted`);
}
