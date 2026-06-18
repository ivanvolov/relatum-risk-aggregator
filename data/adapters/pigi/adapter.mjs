#!/usr/bin/env node
// Pigi adapter — pigi.finance REST API (public, no auth, JSON).
//
// Endpoint discovered 2026-06-17:
//   GET /api/strategies   (must send `accept: application/json` header,
//                          otherwise the Vercel function falls through
//                          to the SPA HTML)
//   → flat array of {id, name, token, type ("usd"|"eth"|"btc"|"eur"|null),
//                    yield30d, riskAdjustedYield30d, tvl, risk (0=safest),
//                    safety, liquidity}
//
// Protocol attribution is encoded in `name` (no separate `protocol` field).
// Names look like: "Sky Spark - Savings Account", "Ethena - sUSDe",
// "Lido - stETH", "Morpho - Gauntlet eUSD Core", "Liquity v1 - Stability Pool",
// "Fluid (InstaDapp) - GHO Lending", "Pendle ...".
//
// 43 strategies as of 2026-06-17. baseRates aggregate is embedded in the
// landing page's window.__PIGI_DATA__ but not exposed as a JSON endpoint;
// scraped from /stablecoins-low-risk if needed.

const BASE = 'https://pigi.finance';

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

let _strategies;
export async function listStrategies() {
  if (!_strategies) _strategies = await fetchJSON(`${BASE}/api/strategies`);
  return _strategies;
}

// Match strategy names to a canonical protocol slug — keyword-based.
// Order matters: more specific patterns first.
const NAME_RULES = [
  // [ regex against lowercased name, canonical slug ]
  // "Sky Spark - Savings Account" surfaces Sky's USDS savings rate via the
  // Spark front-end — credit to Sky (rate provider), not Spark.
  [/sky spark/i, 'sky'],
  [/spark protocol|spark savings|sparklend/i, 'spark'],
  [/^spark\b/i, 'spark'],
  [/sky\b/i, 'sky'],
  [/^morpho\b/i, 'morpho'],
  [/^ethena\b/i, 'ethena'],
  [/^lido\b/i, 'lido'],
  [/liquity v\d/i, 'liquity'],
  [/^liquity\b/i, 'liquity'],
  [/^fluid\b|^fluid \(/i, 'fluid'],
  [/^gearbox\b/i, 'gearbox'],
  [/^pendle\b|\(pendle\)/i, 'pendle'],
  [/^yearn\b|yearn vault/i, 'yearn'],
  [/^aave\b/i, 'aave'],
  [/^euler\b/i, 'euler'],
  [/^uniswap/i, 'uniswap'],
  [/^curve\b/i, 'curve'],
  [/^compound\b/i, 'compound'],
  [/^balancer\b/i, 'balancer'],
  [/^cow ?swap\b/i, 'cowswap'],
  [/^mellow\b/i, 'mellow'],
  [/^ether\.?fi|^etherfi/i, 'etherfi'],
  [/^rocket ?pool/i, 'rocketpool'],
];

export function classifyStrategy(name) {
  for (const [re, slug] of NAME_RULES) if (re.test(name || '')) return slug;
  return null;
}

export async function getProtocol(slug) {
  const all = await listStrategies();
  const matches = all.filter((s) => classifyStrategy(s.name) === slug);
  if (matches.length === 0) return { slug, covered: false, strategies: [] };
  return {
    slug,
    covered: true,
    strategy_count: matches.length,
    avg_risk: avg(matches.map((s) => s.risk).filter(Number.isFinite)),
    avg_yield30d: avg(matches.map((s) => s.yield30d).filter(Number.isFinite)),
    total_tvl: matches.reduce((a, s) => a + (s.tvl || 0), 0),
    strategies: matches.map((s) => ({
      id: s.id, name: s.name, token: s.token, type: s.type,
      risk: s.risk, yield30d: s.yield30d, tvl: s.tvl,
    })),
  };
}

function avg(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    const ss = await listStrategies();
    console.log(`# ${ss.length} strategies`);
    for (const s of ss) console.log(`${String(s.id).padStart(4)} ${(s.name || '').padEnd(48)} risk=${s.risk?.toFixed?.(2) ?? s.risk}  tvl=${(s.tvl || 0).toLocaleString()}  → ${classifyStrategy(s.name) || '—'}`);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      process.stderr.write(p.covered ? `${p.strategy_count} strategies\n` : 'not found\n');
      out[slug] = p;
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: pigi.mjs list | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
