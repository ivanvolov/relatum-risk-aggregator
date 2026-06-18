#!/usr/bin/env node
import { getProtocol, getSidebar, listMarkets } from './defisphere.mjs';
import { writeFile } from 'fs/promises';

const TOP20 = [
  'lido', 'aave', 'spark', 'sky', 'ethena', 'morpho', 'etherfi',
  'uniswap', 'curve', 'compound', 'rocketpool', 'pendle', 'fluid',
  'liquity', 'yearn', 'euler', 'mellow', 'balancer', 'gearbox', 'cowswap',
];

const out = {};
for (const slug of TOP20) {
  process.stderr.write(`${slug.padEnd(12)} `);
  const p = await getProtocol(slug);
  out[slug] = p;
  process.stderr.write(p.covered ? `${p.market_count} markets · ${p.subfamilies.join('|')}\n` : '—\n');
}

const sidebar = await getSidebar();
const markets = await listMarkets();
const summary = {
  fetched_at: new Date().toISOString(),
  total_markets: markets.length,
  sphere_protocols: sidebar.protocols_list,
  sphere_networks: sidebar.networks_list,
  stablecoins_universe_tvl: sidebar.stablecoins.tvl,
};

const path = 'defisphere-2026-06-17.json';
await writeFile(path, JSON.stringify({ summary, protocols: out }, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

const cov = Object.entries(out).filter(([, v]) => v.covered);
process.stderr.write(`\n${cov.length} covered: ${cov.map(([k]) => k).join(', ')}\n`);
