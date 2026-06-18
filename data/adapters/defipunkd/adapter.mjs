#!/usr/bin/env node
// DeFiPunk'd adapter — uses the GitHub raw JSON as a stable API.
//
// Endpoints discovered (no auth, no JS, content-addressed via git SHA):
//   1. List/filter protocols: data/defillama-snapshot.json
//      → all ~8000 DefiLlama protocols keyed by slug, with metadata
//   2. Per-protocol assessment: data/assessments/<slug>/<slice>.json
//      → 5 slices per protocol: verifiability, control, ability-to-exit,
//        autonomy, open-access. Each file has consensus_grade,
//        consensus_strength, short_headline, model votes, protocol_metadata.
//   3. Overlays (curator metadata, no full assessment yet):
//      data/overlays/<slug>.json
//
// Assessed protocols as of 2026-06-08 (35):
//   aave, aave-v3, babylon-protocol, balancer-v3, base-bridge,
//   binance-staked-eth, blackrock-buidl, crvusd, curve-dex, curve-llamalend,
//   eigencloud, ethena-usde, ether.fi-stake, lido, liquity-v1, maple,
//   morpho, morpho-blue, nexus-mutual, ondo-yield-assets, pendle,
//   polymarket-international, railgun, rocket-pool, sky-lending, sparklend,
//   ssv-network, tether, tether-gold, tornado-cash, uniswap-v4, veda,
//   wbtc, zyfai
//
// Usage:
//   node defipunkd.mjs list                  → print slug,name,tvl for all
//   node defipunkd.mjs list "lending"        → filter by name substring
//   node defipunkd.mjs get sky-lending       → merged 5-slice JSON
//   node defipunkd.mjs get sparklend morpho-blue ethena-usde   → batch

import { writeFile } from 'fs/promises';

const RAW = 'https://raw.githubusercontent.com/guil-lambert/defipunkd/main/data';
const SLICES = ['verifiability', 'control', 'ability-to-exit', 'autonomy', 'open-access'];

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// --- API 1: protocol registry ---
let _snapshot;
async function snapshot() {
  if (!_snapshot) _snapshot = await fetchJSON(`${RAW}/defillama-snapshot.json`);
  return _snapshot;
}

export async function listProtocols(nameFilter) {
  const snap = await snapshot();
  const rows = Object.values(snap.protocols);
  const filtered = nameFilter
    ? rows.filter((p) => (p.name || '').toLowerCase().includes(nameFilter.toLowerCase()) ||
                         (p.slug || '').toLowerCase().includes(nameFilter.toLowerCase()))
    : rows;
  return filtered.map((p) => ({ slug: p.slug, name: p.name, category: p.category, chains: p.chains, tvl: p.tvl }));
}

// --- API 2: per-protocol assessment ---
export async function getAssessment(slug) {
  const slices = {};
  await Promise.all(SLICES.map(async (s) => {
    try {
      slices[s] = await fetchJSON(`${RAW}/assessments/${slug}/${s}.json`);
    } catch (e) {
      slices[s] = { error: e.message };
    }
  }));
  // Snapshot metadata for this slug
  const snap = await snapshot();
  const meta = snap.protocols[slug] || null;
  return { slug, snapshot: meta, slices };
}

// --- CLI ---
import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd) {
    console.error('usage: defipunkd.mjs list [filter] | get <slug> [slug2 ...]');
    process.exit(1);
  }
  if (cmd === 'list') {
    const rows = await listProtocols(args[0]);
    console.log(`# ${rows.length} protocols`);
    for (const r of rows.slice(0, 50)) {
      console.log(`${r.slug.padEnd(40)} ${(r.name || '').padEnd(40)} ${(r.category || '').padEnd(20)} ${(r.tvl || 0).toLocaleString()}`);
    }
    if (rows.length > 50) console.log(`... and ${rows.length - 50} more`);
  } else if (cmd === 'get') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const a = await getAssessment(slug);
      const got = Object.entries(a.slices).filter(([, v]) => !v.error).map(([k]) => k);
      process.stderr.write(`${got.length}/5 slices\n`);
      out[slug] = a;
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error(`unknown: ${cmd}`);
    process.exit(1);
  }
}
