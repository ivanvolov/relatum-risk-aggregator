#!/usr/bin/env node
import { getProtocol as xerProto } from './xerberus.mjs';
import { getProtocol as zyfProto } from './zyfai.mjs';
import { getProtocol as credProto } from './credora.mjs';
import { writeFile } from 'fs/promises';

const TOP20 = [
  'lido', 'aave', 'spark', 'sky', 'ethena', 'morpho', 'etherfi',
  'uniswap', 'curve', 'compound', 'rocketpool', 'pendle', 'fluid',
  'liquity', 'yearn', 'euler', 'mellow', 'balancer', 'gearbox', 'cowswap',
];

for (const [name, fn] of [['xerberus', xerProto], ['zyfai', zyfProto], ['credora', credProto]]) {
  process.stderr.write(`\n=== ${name} ===\n`);
  const out = {};
  for (const slug of TOP20) {
    process.stderr.write(`${slug.padEnd(12)} `);
    const p = await fn(slug);
    out[slug] = p;
    process.stderr.write(p.covered ? 'cov\n' : '—\n');
  }
  const path = `${name}-2026-06-17.json`;
  await writeFile(path, JSON.stringify({ fetched_at: new Date().toISOString(), protocols: out }, null, 2));
  const cov = Object.entries(out).filter(([, v]) => v.covered).map(([k]) => k);
  process.stderr.write(`wrote ${path}; ${cov.length} covered: ${cov.join(', ')}\n`);
}
