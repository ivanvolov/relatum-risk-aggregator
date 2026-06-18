#!/usr/bin/env node
// StableWatch adapter — stablewatch.io API (public, no auth).
//
// Endpoints discovered 2026-06-17 via headless sniff of stablewatch.io:
//
//   GET https://www.stablewatch.io/api/ypotable
//   → aggregate YPO (yield-bearing stablecoin AUM): allTimeSum, ypo7d,
//     ypo30d, etc., plus a timeseries.
//
//   GET https://www.stablewatch.io/api/ypotablelist
//   → array of {id (contract address), asset (token ticker), protocol,
//                token: {chains, image, market_data}, metrics: {tvl: {...}}}
//
// Direct curl returned 301 from the apex; use the www host directly. As of
// 2026-06-17, 94 yield-bearing stablecoins from ~60 protocols.

const BASE = 'https://www.stablewatch.io/api';

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const body = await r.json();
  if (body.status && body.status !== 'success') throw new Error(`status=${body.status}`);
  return body;
}

let _aggregate;
export async function getAggregate() {
  if (!_aggregate) _aggregate = await fetchJSON(`${BASE}/ypotable`);
  return _aggregate;
}

let _assets;
export async function listAssets() {
  if (!_assets) _assets = (await fetchJSON(`${BASE}/ypotablelist`)).data;
  return _assets;
}

// Protocol names in StableWatch are TitleCase (e.g., "Aave", "Sky", "Curve").
// Map Relatum lowercase slugs → StableWatch's protocol names.
const PROTOCOL_MAP = {
  aave: 'Aave',
  sky: 'Sky',
  ethena: 'Ethena',
  liquity: 'Liquity',
  curve: 'Curve',
  spark: 'Spark',
  morpho: 'Morpho',
  compound: 'Compound',
  lido: 'Lido',
  fluid: 'Fluid',
  pendle: 'Pendle',
  yearn: 'Yearn',
  euler: 'Euler',
  uniswap: 'Uniswap',
  balancer: 'Balancer',
  rocketpool: 'Rocket Pool',
  etherfi: 'ether.fi',
  gearbox: 'Gearbox',
  cowswap: 'CoW Swap',
  mellow: 'Mellow',
};

export async function getProtocol(slug) {
  const all = await listAssets();
  const swName = PROTOCOL_MAP[slug];
  if (!swName) return { slug, covered: false, reason: 'no slug mapping' };
  const matches = all.filter((r) => r.protocol === swName);
  return {
    slug,
    stablewatch_name: swName,
    covered: matches.length > 0,
    asset_count: matches.length,
    total_tvl: matches.reduce((s, r) => s + (r.metrics?.tvl?.current || 0), 0),
    assets: matches.map((r) => ({
      asset: r.asset,
      address: r.id,
      tvl_current: r.metrics?.tvl?.current,
      tvl_avg30d: r.metrics?.tvl?.avg30d,
      price_usd: r.token?.market_data?.current_price?.usd,
    })),
  };
}

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'aggregate') {
    const a = await getAggregate();
    console.log(JSON.stringify({ allTimeSum: a.allTimeSum, ypo7d: a.ypo7d, ypo30d: a.ypo30d, ypo90d: a.ypo90d, ypo365d: a.ypo365d }, null, 2));
  } else if (cmd === 'list') {
    const all = await listAssets();
    console.log(`# ${all.length} yield-bearing stablecoins`);
    for (const r of all) console.log(`${(r.asset || '').padEnd(22)} ${(r.protocol || '').padEnd(25)} tvl=$${(r.metrics?.tvl?.current || 0).toLocaleString()}`);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(p.covered ? `${p.asset_count} assets\n` : '—\n');
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: stablewatch.mjs aggregate | list | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
