// For every protocol in the registry, emit public/data/protocols/<slug>.json.
// Reads (in priority order):
//   - public/data/feeds/<feedId>.json                     (per-feed normalized adapter output — highest)
//   - data/ontology/protocols/<ontologyDir>/_prose.yaml   (hand-curated overlay)
//   - data/ontology/protocols/<ontologyDir>/combined.ttl  (TTL claims, optional)
//   - data/seeds/coverage-seed.yaml                       (fallback per-feed status)
// Writes:
//   - public/data/protocols/<slug>.json

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { loadStore, claimsByFeed, splitCurrentVsHistory } from './lib/ttl-load.mjs';
import { FEED_REGISTRY, PROTOCOLS, slugToOntologyDir } from './lib/registry.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ONT  = path.join(ROOT, 'data', 'ontology', 'protocols');
const SEEDS = path.join(ROOT, 'data', 'seeds');
const OUT  = path.join(ROOT, 'public', 'data', 'protocols');
const FEEDS_DIR = path.join(ROOT, 'public', 'data', 'feeds');

const adapterImplemented = (feedId) => existsSync(path.join(FEEDS_DIR, `${feedId}.json`));

async function loadFeedJsons() {
  const map = new Map();
  for (const f of FEED_REGISTRY) {
    const p = path.join(FEEDS_DIR, `${f.id}.json`);
    if (existsSync(p)) {
      map.set(f.id, JSON.parse(await readFile(p, 'utf8')));
    }
  }
  return map;
}

export async function buildProtocolJson(proto, coverageSeed, feedJsons) {
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

    // Per-feed normalized output (from feeds-to-json) — when present, this is the
    // canonical statement of whether the feed covers this protocol and what it says.
    const feedDoc = feedJsons.get(feedId);
    const feedRow = feedDoc?.protocols?.[proto.slug];

    const fromFeedStatus = feedRow ? (feedRow.covered ? 'cov' : 'none') : null;
    const inferredFromClaims = ttlEntry.claims.length > 0 ? 'cov' : null;

    const status =
      fromFeedStatus              // highest — normalized adapter output
      ?? overlay.status           // explicit prose override
      ?? ttlEntry.status          // TTL CoverageStatement
      ?? inferredFromClaims       // claims exist but no CoverageStatement
      ?? seedRow[feedId]          // baseline from coverage-seed.yaml
      ?? 'none';

    const { current, history } = splitCurrentVsHistory(ttlEntry.claims);
    const claims = feedRow?.claims ?? current;

    return {
      feedId,
      status,                                          // cov | part | none
      adapterStatus,                                   // implemented | pending
      inline: feedRow?.inline ?? null,                 // short matrix-cell value (e.g. "Stage 0")
      sourceUrl: feedRow?.deeplink ?? overlay.sourceUrl ?? ttlEntry.sourceUrl ?? null,
      observedAt: feedRow?.observedAt ?? overlay.observedAt ?? ttlEntry.observedAt ?? null,
      methodology: overlay.methodology ?? null,
      coverageReason: feedRow?.reason ?? overlay.coverageReason ?? ttlEntry.coverageReason ?? null,
      claims,
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
    logoUrl: proto.logoUrl || null,
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
  const feedJsons = await loadFeedJsons();
  let written = 0;
  for (const proto of PROTOCOLS) {
    const json = await buildProtocolJson(proto, coverageSeed, feedJsons);
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
