#!/usr/bin/env node
import { getProtocol, listPosts } from './llamarisk.mjs';
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
  process.stderr.write(p.covered ? `${p.post_count} posts (${p.first_post_date}…${p.latest_post_date})\n` : '—\n');
}

const total = await listPosts();
const summary = {
  fetched_at: new Date().toISOString(),
  total_substack_posts: total.length,
  archive_oldest: total.at(-1)?.post_date?.slice(0, 10),
  archive_newest: total[0]?.post_date?.slice(0, 10),
};

const path = 'llamarisk-2026-06-17.json';
await writeFile(path, JSON.stringify({ summary, protocols: out }, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

const cov = Object.entries(out).filter(([, v]) => v.covered);
process.stderr.write(`\n${cov.length} substack-attested: ${cov.map(([k]) => k).join(', ')}\n`);
