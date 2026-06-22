// For every protocol in the registry, emit public/data/protocols/<slug>.json.
//
// Reads:
//   - public/data/feeds/<feedId>.json                     (per-feed normalized adapter output)
//   - data/adapters/defillama/output/<latest>.json        (metadata: description, audits, chains, governance)
//   - data/build/lib/registry.mjs                         (canonical protocol roster)
//
// Writes:
//   - public/data/protocols/<slug>.json
//
// The TTL + _prose.yaml + coverage-seed.yaml pipeline that previously fed this
// file has been parked in `ontology/`. A future script will reconstruct the
// ontology from the live data this pipeline produces.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FEED_REGISTRY, PROTOCOLS } from './lib/registry.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
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

// Treat the registry's '—' placeholder as missing so DefiLlama can fill the gap.
function pickReal(...candidates) {
  for (const v of candidates) {
    if (v == null) continue;
    const s = String(v).trim();
    if (!s || s === '—' || s === '-') continue;
    return v;
  }
  return null;
}

// DefiLlama exposes a `governanceID` like "snapshot:etherfi-dao.eth" or "tally:...".
// Surface a compact "Snapshot · <space>" string when nothing better.
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

export async function buildProtocolJson(proto, feedJsons, llamaByProto) {
  const llama = llamaByProto?.[proto.slug]?.covered ? llamaByProto[proto.slug] : null;

  const feeds = FEED_REGISTRY.map(f => {
    const feedId = f.id;
    const adapterStatus = adapterImplemented(feedId) ? 'implemented' : 'pending';
    const feedDoc = feedJsons.get(feedId);
    const feedRow = feedDoc?.protocols?.[proto.slug];
    // Status priority: partial > covered > none. `verified` is metadata, not a status.
    let status = 'none';
    if (feedRow?.partial) status = 'part';
    else if (feedRow?.covered) status = 'cov';

    return {
      feedId,
      status,
      adapterStatus,
      inline: feedRow?.inline ?? null,
      sourceUrl: feedRow?.deeplink ?? null,
      observedAt: feedRow?.observedAt ?? null,
      methodology: null,
      coverageReason: feedRow?.reason ?? null,
      partialNote: feedRow?.partialNote ?? null,
      verified: feedRow?.verified ?? null,
      claims: feedRow?.claims ?? [],
      history: [],
      notable: null,
      findings: null,
    };
  });

  const allDates = feeds.map(f => f.observedAt).filter(Boolean).sort();
  const lastUpdated = allDates.length ? allDates[allDates.length - 1] : null;

  return {
    slug: proto.slug,
    name: proto.name || llama?.name,
    category: proto.category || llama?.category,
    tvl_usd: llama?.tvl_usd ?? proto.tvl_usd,
    family: proto.family,
    versions: proto.versions ?? null,
    logoUrl: proto.logoUrl || null,
    description: llama?.description || null,
    homepage: llama?.url || null,
    twitter: llama?.twitter || proto.twitter || null,
    github: llama?.github || [],
    chains: llama?.chains || [],
    parent_protocol: llama?.parent_protocol || null,
    governance_id: llama?.governance_id || null,
    methodology_url: llama?.methodology_url || null,
    lastUpdated,
    governance_summary: pickReal(proto.governance_summary, llamaGovernanceSummary(llama)),
    governance_degrade_note: null,
    inlineRating: proto.inlineRating ?? {},
    sidecards: [],
    audit_count: llama?.audits ?? null,
    audit_history: llamaAuditsToHistory(llama),
    incidents: [],
    feeds,
  };
}

export async function run() {
  await mkdir(OUT, { recursive: true });
  const feedJsons = await loadFeedJsons();
  const llamaByProto = await loadLlamaSnapshot();
  let written = 0;
  for (const proto of PROTOCOLS) {
    const json = await buildProtocolJson(proto, feedJsons, llamaByProto);
    const outPath = path.join(OUT, `${proto.slug}.json`);
    await writeFile(outPath, JSON.stringify(json, null, 2));
    const cov = json.feeds.filter(f => f.status === 'cov').length;
    const pending = json.feeds.filter(f => f.adapterStatus === 'pending').length;
    const claims = json.feeds.reduce((n, f) => n + f.claims.length, 0);
    console.log(`  ${proto.slug.padEnd(11)} cov=${cov} pending=${pending} claims=${claims}`);
    written++;
  }
  return written;
}
