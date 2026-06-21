// For every protocol in the registry, emit public/data/protocols/<slug>.json.
// Reads (in priority order):
//   - public/data/feeds/<feedId>.json                     (per-feed normalized adapter output — highest)
//   - data/adapters/defillama/output/<latest>.json        (DefiLlama metadata: description, audits, chains, governance)
//   - data/ontology/protocols/<ontologyDir>/_prose.yaml   (hand-curated overlay — soft fallback only)
//   - data/ontology/protocols/<ontologyDir>/combined.ttl  (TTL claims, optional)
//   - data/seeds/coverage-seed.yaml                       (fallback per-feed status)
// Writes:
//   - public/data/protocols/<slug>.json

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
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
const LLAMA_DIR = path.join(ROOT, 'data', 'adapters', 'defillama', 'output');

async function loadLlamaSnapshot() {
  if (!existsSync(LLAMA_DIR)) return {};
  const files = (await readdir(LLAMA_DIR)).filter(n => n.endsWith('.json')).sort();
  if (!files.length) return {};
  const raw = JSON.parse(await readFile(path.join(LLAMA_DIR, files.at(-1)), 'utf8'));
  return raw.protocols || {};
}

// DefiLlama's audits/audit_links list → audit_history entries the UI already understands
// (ProtocolDetail.jsx renders {firm, date, report_url} per row). Firm is the host slug
// pulled out of the URL (best-effort); date stays null because DefiLlama doesn't carry it.
function llamaAuditsToHistory(llama) {
  const links = llama?.audit_links || [];
  if (!links.length) return [];
  return links.map((url) => {
    let firm = null;
    try {
      const u = new URL(url);
      firm = u.hostname.replace(/^www\./, '').split('.')[0];
    } catch {}
    return { firm, date: null, report_url: url };
  });
}

// Treat the registry's '—' / empty-string placeholders as missing so a downstream
// adapter value (DefiLlama) can fill the gap.
function pickReal(...candidates) {
  for (const v of candidates) {
    if (v == null) continue;
    const s = String(v).trim();
    if (!s || s === '—' || s === '-') continue;
    return v;
  }
  return null;
}

// DefiLlama exposes a `governanceID` like "snapshot:etherfi-dao.eth" or
// "tally:...". Surface a compact "Snapshot · <space>" string when nothing better.
function llamaGovernanceSummary(llama) {
  const ids = llama?.governance_id || [];
  if (!ids.length) return null;
  const first = ids[0];
  const [kind, ref] = String(first).split(':');
  if (kind === 'snapshot' && ref) return `Snapshot · ${ref}`;
  if (kind === 'tally' && ref)    return `Tally · ${ref}`;
  if (kind === 'compound' && ref) return `Compound Gov · ${ref}`;
  return first;
}

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

export async function buildProtocolJson(proto, coverageSeed, feedJsons, llamaByProto) {
  const llama = llamaByProto?.[proto.slug]?.covered ? llamaByProto[proto.slug] : null;
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

  // Metadata priority: prose overlay → DefiLlama snapshot → registry default.
  // DefiLlama covers all 23 in one fetch; _prose.yaml is a soft overlay that
  // wins when present (only aave-v3/_prose.yaml exists today).
  return {
    slug: proto.slug,
    name: prose.name || proto.name || llama?.name,
    category: prose.category || proto.category || llama?.category,
    tvl_usd: prose.tvl_usd ?? llama?.tvl_usd ?? proto.tvl_usd,
    family: prose.family || proto.family,
    versions: prose.versions ?? proto.versions ?? null,
    logoUrl: proto.logoUrl || null,
    description: prose.description || llama?.description || null,
    homepage: prose.homepage || llama?.url || null,
    twitter: prose.twitter || llama?.twitter || proto.twitter || null,
    github: prose.github || llama?.github || [],
    chains: prose.chains || llama?.chains || [],
    parent_protocol: prose.parent_protocol || llama?.parent_protocol || null,
    governance_id: prose.governance_id || llama?.governance_id || null,
    methodology_url: prose.methodology_url || llama?.methodology_url || null,
    lastUpdated,
    governance_summary: pickReal(prose.governance_summary, proto.governance_summary, llamaGovernanceSummary(llama)),
    governance_degrade_note: prose.governance_degrade_note ?? null,
    inlineRating: prose.inlineRating ?? proto.inlineRating ?? {},
    sidecards: prose.sidecards ?? [],
    audit_count: prose.audit_count ?? llama?.audits ?? null,
    audit_history: prose.audit_history ?? llamaAuditsToHistory(llama),
    incidents: prose.incidents ?? [],
    feeds,
  };
}

export async function run() {
  await mkdir(OUT, { recursive: true });
  const coverageSeed = YAML.parse(await readFile(path.join(SEEDS, 'coverage-seed.yaml'), 'utf8'));
  const feedJsons = await loadFeedJsons();
  const llamaByProto = await loadLlamaSnapshot();
  let written = 0;
  for (const proto of PROTOCOLS) {
    const json = await buildProtocolJson(proto, coverageSeed, feedJsons, llamaByProto);
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
