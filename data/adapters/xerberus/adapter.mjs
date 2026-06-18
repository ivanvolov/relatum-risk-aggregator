#!/usr/bin/env node
// Xerberus adapter — app.xerberus.io dendrogram API (public, no auth).
//
// Endpoints discovered 2026-06-17 via headless sniff of app.xerberus.io:
//
//   GET /api/dendrogram/registry
//   GET /api/dendrogram/registry?classes=Organisation,Pool,Protocol&fields=list
//   → {data: {assets:[...], protocols:[...], organisations:[...], pools:[...]}}
//   Each protocol: {id, name, logo_url, seed_address, connections, website, has_scorecard}
//
//   GET /api/dendrogram/scores?classes=Pool,Protocol,Asset,Organisation
//   → {data: {protocols:{<id>: {composite_score, domain_scores:{...}}},
//              pools:{...}, assets:{...}, organisations:{...}}}
//
// Coverage as of 2026-06-17: 99 assets, 42 protocols (56 with scorecards),
// 86 pools, 52 organisations. Scores range 0..1 (higher = safer per their
// scale, based on observed magnitudes — Lido v2 = 0.845, Layerzero V2 = 0.330).
//
// Open beta (v3.1.0); per the homepage "300+ RISK SUBSCORES, 85+ DEFI
// MECHANISMS." Subscore tree is available per pool/protocol but only via
// the rendered DOM at /scorecards/<id>; not surfaced through this endpoint.

const BASE = 'https://app.xerberus.io/api/dendrogram';

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

let _registry;
export async function getRegistry() {
  if (!_registry) _registry = (await fetchJSON(`${BASE}/registry`)).data;
  return _registry;
}

let _scores;
export async function getScores() {
  if (!_scores) _scores = (await fetchJSON(`${BASE}/scores?classes=Pool,Protocol,Asset,Organisation`)).data;
  return _scores;
}

// Map Relatum slugs → Xerberus protocol ids. Xerberus uses versioned ids
// like "aave-v3" and "morpho-v2"; multiple versions count toward one slug.
const PROTOCOL_MAP = {
  aave:       ['aave-v3'],
  morpho:     ['morpho-v1', 'morpho-v2'],
  spark:      ['spark-v1', 'spark-savings-v2'],
  euler:      ['euler-v2'],
  compound:   ['compound-v3'],
  lido:       ['lido-v2'],
  ethena:     ['ethena-v1'],
  curve:      ['curve-v2'],
  pendle:     ['pendle-v2'],
  fluid:      ['fluid-v1'],
  gearbox:    ['gearbox-v3'],
  sky:        [],   // not in Xerberus dendrogram
  etherfi:    [],
  uniswap:    [],
  rocketpool: [],
  liquity:    [],
  yearn:      [],
  mellow:     [],
  balancer:   [],
  cowswap:    [],
};

export async function getProtocol(slug) {
  const ids = PROTOCOL_MAP[slug] || [];
  if (ids.length === 0) return { slug, covered: false, reason: 'not in Xerberus dendrogram' };
  const registry = await getRegistry();
  const scores = await getScores();
  const versions = [];
  for (const id of ids) {
    const meta = registry.protocols.find((p) => p.id === id);
    const score = scores.protocols?.[id];
    if (meta) versions.push({ id, name: meta.name, website: meta.website, composite_score: score?.composite_score ?? null, domain_scores: score?.domain_scores ?? null });
  }
  if (versions.length === 0) return { slug, covered: false, reason: 'no registry match for mapped ids' };
  return {
    slug,
    covered: true,
    version_count: versions.length,
    avg_composite: avg(versions.map((v) => v.composite_score).filter(Number.isFinite)),
    versions,
  };
}

function avg(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'protocols') {
    const r = await getRegistry();
    const s = await getScores();
    console.log(`# ${r.protocols.length} protocols`);
    for (const p of r.protocols) {
      const sc = s.protocols?.[p.id]?.composite_score;
      console.log(`${p.id.padEnd(30)} ${(p.name || '').padEnd(22)} composite=${sc?.toFixed?.(3) ?? '—'}`);
    }
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(p.covered ? `${p.version_count} versions, avg=${p.avg_composite?.toFixed(3)}\n` : '—\n');
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: xerberus.mjs protocols | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
