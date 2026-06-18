#!/usr/bin/env node
import { getProtocol, getStablecoinProfile, listStablecoinSlugs } from './pharos.mjs';
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
  process.stderr.write(p.covered ? `${p.stablecoin_count} stablecoins\n` : '—\n');
}

// Anchor: fetch the Sky/USDS profile to sanity-check the page parser.
process.stderr.write('\nanchor profile usds-sky ... ');
const anchor = await getStablecoinProfile('usds-sky');
process.stderr.write(`${anchor.governance_model || 'unparsed'}\n`);

const total = await listStablecoinSlugs();
const summary = {
  fetched_at: new Date().toISOString(),
  total_stablecoins_in_feed: total.length,
  anchor_profile_usds_sky: anchor,
};

const path = 'pharos-2026-06-17.json';
await writeFile(path, JSON.stringify({ summary, protocols: out }, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

const cov = Object.entries(out).filter(([, v]) => v.covered);
process.stderr.write(`\n${cov.length} covered: ${cov.map(([k]) => k).join(', ')}\n`);
