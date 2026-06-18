#!/usr/bin/env node
// DeFi Sphere adapter — sphere.data.blockanalitica.com REST API (public, no auth).
//
// Discovered 2026-06-17 via headless sniff of defi-sphere.com (the SPA
// hydrates from this Block Analitica-hosted backend):
//
//   GET https://sphere.data.blockanalitica.com/protocols/sidebar/
//   → {data: {stablecoins: {...}, protocols_list: [...], networks_list: [...]}}
//
//   GET https://sphere.data.blockanalitica.com/markets/?page=N&limit=L&sort=-total_supply_usd
//   → {data: {results: [{pool_id, name, protocol, network, type, underlying_*,
//                        total_supply_usd, supply_apy, total_borrow_usd, borrow_apy,
//                        utilization_rate, ltv, liquidation_threshold,
//                        collateral_risk_score, liquidity_risk_score, ...}]}}
//
// Pagination uses ?page=N, but ?limit=500 returns all 397 markets in one shot.
// Protocols indexed as of 2026-06-17 (with subfamilies grouped):
//   aave (aave_v3, aave_v3_core, aave_v3_horizon, aave_v3_prime)
//   morpho
//   spark (sparklend)
//   compound (compound_v3)
//   liquity (liquity_v2)

const BASE = 'https://sphere.data.blockanalitica.com';

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const body = await r.json();
  if (body.success === false) throw new Error(`unsuccessful: ${JSON.stringify(body).slice(0, 200)}`);
  return body.data;
}

let _sidebar;
export async function getSidebar() {
  if (!_sidebar) _sidebar = await fetchJSON(`${BASE}/protocols/sidebar/`);
  return _sidebar;
}

let _markets;
export async function listMarkets() {
  if (!_markets) _markets = (await fetchJSON(`${BASE}/markets/?limit=500&sort=-total_supply_usd`)).results;
  return _markets;
}

// Map Sphere's protocol identifiers (subfamilies and all) back to Relatum
// canonical slugs.
const PROTOCOL_MAP = {
  aave_v3:         'aave',
  aave_v3_core:    'aave',
  aave_v3_horizon: 'aave',
  aave_v3_prime:   'aave',
  morpho:          'morpho',
  sparklend:       'spark',
  compound_v3:     'compound',
  liquity_v2:      'liquity',
};

export async function getProtocol(slug) {
  const markets = await listMarkets();
  const matches = markets.filter((m) => PROTOCOL_MAP[m.protocol] === slug);
  if (matches.length === 0) return { slug, covered: false, markets: [] };
  return {
    slug,
    covered: true,
    market_count: matches.length,
    subfamilies: [...new Set(matches.map((m) => m.protocol))],
    total_supply_usd: matches.reduce((s, m) => s + Number(m.total_supply_usd || 0), 0),
    total_borrow_usd: matches.reduce((s, m) => s + Number(m.total_borrow_usd || 0), 0),
    avg_collateral_risk: avg(matches.map((m) => Number(m.collateral_risk_score)).filter(Number.isFinite)),
    avg_liquidity_risk: avg(matches.map((m) => Number(m.liquidity_risk_score)).filter(Number.isFinite)),
    networks: [...new Set(matches.map((m) => m.network))],
    markets: matches.slice(0, 30).map((m) => ({
      pool_id: m.pool_id,
      name: m.name,
      subfamily: m.protocol,
      network: m.network,
      underlying: m.underlying_symbol,
      collateral: m.collateral_symbol,
      total_supply_usd: Number(m.total_supply_usd),
      supply_apy: Number(m.supply_apy),
      utilization: Number(m.utilization_rate),
      collateral_risk: Number(m.collateral_risk_score),
      liquidity_risk: Number(m.liquidity_risk_score),
    })),
  };
}

function avg(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'sidebar') {
    const s = await getSidebar();
    console.log(JSON.stringify({ protocols_list: s.protocols_list, networks_list: s.networks_list, stablecoins_summary: { tvl: s.stablecoins.tvl, date: s.stablecoins.date } }, null, 2));
  } else if (cmd === 'markets') {
    const m = await listMarkets();
    const counts = {};
    for (const x of m) counts[x.protocol] = (counts[x.protocol] || 0) + 1;
    console.log(`# ${m.length} markets total`);
    for (const [p, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(p.padEnd(20), n);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(p.covered ? `${p.market_count} markets\n` : '—\n');
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: defisphere.mjs sidebar | markets | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
