#!/usr/bin/env node
import { getAggregate, getProtocol, listAssets } from './stablewatch.mjs';
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
  process.stderr.write(p.covered ? `${p.asset_count} assets, tvl=$${p.total_tvl.toLocaleString()}\n` : '—\n');
}

const total = await listAssets();
const agg = await getAggregate();
const summary = {
  fetched_at: new Date().toISOString(),
  total_assets_in_feed: total.length,
  ypo_aggregate: { all_time_sum: agg.allTimeSum, ypo7d: agg.ypo7d, ypo30d: agg.ypo30d },
};

const path = 'stablewatch-2026-06-17.json';
await writeFile(path, JSON.stringify({ summary, protocols: out }, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

const cov = Object.entries(out).filter(([, v]) => v.covered);
process.stderr.write(`\n${cov.length} covered: ${cov.map(([k]) => k).join(', ')}\n`);
