#!/usr/bin/env node
import { getProtocol } from './defisaver.mjs';
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
  process.stderr.write(p.covered ? `${p.surfaces.join(',')}\n` : '—\n');
}

const path = 'defisaver-2026-06-17.json';
await writeFile(path, JSON.stringify({ fetched_at: new Date().toISOString(), protocols: out }, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

const cov = Object.entries(out).filter(([, v]) => v.covered);
process.stderr.write(`\n${cov.length} covered: ${cov.map(([k]) => k).join(', ')}\n`);
