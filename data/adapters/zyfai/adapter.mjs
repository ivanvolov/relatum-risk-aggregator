#!/usr/bin/env node
// Zyfai adapter — defiapi.zyf.ai REST API (public, no auth).
//
// Endpoints discovered 2026-06-17 via headless sniff of zyf.ai:
//
//   GET https://defiapi.zyf.ai/api/v2/opportunities/degen?chainId=<n>&status=live
//   → {status: "success", data: [{id, timestamp, protocol_name, pool_name,
//                                  pool_apy, rewards_apy, combined_apy, tvl,
//                                  liquidity, strategy_type, chain_id,
//                                  interestratestrategy, url, collateral_symbols,
//                                  pool_address, vault_allocations}]}
//
//   GET https://defiapi.zyf.ai/api/v2/opportunities/async?chainId=<n>&status=live&asset=<usdc|...>
//   GET https://api.zyf.ai/api/v1/data/usd-tvl
//   GET https://api.zyf.ai/api/v1/data/volume?assetType=eth|usdc
//
// Per-chain endpoint: paginate by chainId across all chains they index.
// As of 2026-06-17, scraped chains: 1 (Ethereum), 8453 (Base), 42161 (Arbitrum),
// plus 146 + 9745 which currently 404 or return errors.

const KNOWN_CHAINS = [1, 8453, 42161];

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const body = await r.json();
  if (body.status && body.status !== 'success') throw new Error(`status=${body.status}`);
  return body.data;
}

let _opportunities;
export async function listOpportunities() {
  if (_opportunities) return _opportunities;
  const all = [];
  for (const chainId of KNOWN_CHAINS) {
    try {
      const arr = await fetchJSON(`https://defiapi.zyf.ai/api/v2/opportunities/degen?chainId=${chainId}&status=live`);
      if (Array.isArray(arr)) all.push(...arr);
    } catch (e) { /* skip failed chains */ }
  }
  _opportunities = all;
  return _opportunities;
}

// Zyfai protocol_name values are TitleCase, e.g., "Morpho", "Aave V3", "Spark".
const PROTOCOL_MAP = {
  morpho:    /^morpho$/i,
  aave:      /^aave/i,
  spark:     /^spark/i,
  compound:  /^compound/i,
  euler:     /^euler/i,
  yearn:     /^yearn/i,
  fluid:     /^fluid/i,
  sky:       /^sky$/i,
  lido:      /^lido$/i,
  ethena:    /^ethena$/i,
  etherfi:   /^ether\.?fi$|^etherfi$/i,
  uniswap:   /^uniswap/i,
  curve:     /^curve$|^crv/i,
  liquity:   /^liquity/i,
  pendle:    /^pendle$/i,
  rocketpool:/^rocket ?pool$/i,
  mellow:    /^mellow$/i,
  balancer:  /^balancer$/i,
  gearbox:   /^gearbox$/i,
  cowswap:   /^cow ?swap$/i,
};

export async function getProtocol(slug) {
  const re = PROTOCOL_MAP[slug];
  if (!re) return { slug, covered: false, reason: 'no slug mapping' };
  const ops = await listOpportunities();
  const matches = ops.filter((o) => re.test(o.protocol_name || ''));
  if (matches.length === 0) return { slug, covered: false };
  return {
    slug,
    covered: true,
    opportunity_count: matches.length,
    total_tvl: matches.reduce((s, o) => s + (o.tvl || 0), 0),
    avg_apy: avg(matches.map((o) => o.combined_apy).filter(Number.isFinite)),
    chains: [...new Set(matches.map((o) => o.chain_id))],
    pools: matches.slice(0, 30).map((o) => ({
      protocol: o.protocol_name,
      pool: o.pool_name,
      chain_id: o.chain_id,
      tvl: o.tvl,
      apy: o.combined_apy,
      url: o.url,
    })),
  };
}

function avg(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    const ops = await listOpportunities();
    console.log(`# ${ops.length} live opportunities`);
    const byProto = {};
    for (const o of ops) byProto[o.protocol_name] = (byProto[o.protocol_name] || 0) + 1;
    for (const [p, n] of Object.entries(byProto).sort((a, b) => b[1] - a[1])) console.log(`${p.padEnd(28)} ${n}`);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(p.covered ? `${p.opportunity_count} opps, avg_apy=${p.avg_apy?.toFixed(2)}\n` : '—\n');
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: zyfai.mjs list | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
