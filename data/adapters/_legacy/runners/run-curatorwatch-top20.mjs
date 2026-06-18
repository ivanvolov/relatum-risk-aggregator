#!/usr/bin/env node
import { getProtocol, listCurators } from './curatorwatch.mjs';
import { writeFile } from 'fs/promises';

// Map Relatum slugs → CuratorWatch `protocol` slugs (lowercase, as used in
// the API's vault.protocol field). Many Relatum protocols aren't lending
// rails curated on CuratorWatch and therefore can't appear as `protocol=...`
// values — the curator-side coverage from the YAML registry is aspirational.
const MAP = {
  lido:       'lido',
  morpho:     'morpho',
  spark:      'spark',
  sky:        'sky',
  euler:      'euler',
  aave:       'aave',          // not currently in feed
  ethena:     'ethena',        // not currently in feed
  etherfi:    'etherfi',
  uniswap:    null,            // not a curatable lending rail
  curve:      null,
  compound:   'compound',
  rocketpool: null,
  pendle:     null,
  fluid:      'fluid',
  liquity:    'liquity',
  yearn:      'yearn',
  mellow:     null,
  balancer:   null,
  gearbox:    null,
  cowswap:    null,
};

const out = {};
for (const [relatumSlug, cwSlug] of Object.entries(MAP)) {
  process.stderr.write(`${relatumSlug.padEnd(12)} `);
  if (cwSlug === null) {
    out[relatumSlug] = { covered: false, reason: 'not a lending rail curated on CuratorWatch' };
    process.stderr.write('— skipped (not a lending rail)\n');
    continue;
  }
  const p = await getProtocol(cwSlug);
  out[relatumSlug] = p;
  process.stderr.write(p.covered ? `${p.vault_count} vaults, ${p.curators.length} curators\n` : 'not in current feed\n');
}

// Aggregate stats so we know what we got.
const cs = await listCurators();
const summary = {
  fetched_at: new Date().toISOString(),
  total_curators: cs.length,
  total_aum_usd: cs.reduce((s, c) => s + (c.totalAUM || 0), 0),
  total_vaults: cs.reduce((s, c) => s + (c.vaultCount || 0), 0),
};

const path = 'curatorwatch-2026-06-17.json';
await writeFile(path, JSON.stringify({ summary, protocols: out }, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

const cov = Object.entries(out).filter(([, v]) => v.covered);
const non = Object.entries(out).filter(([, v]) => !v.covered);
process.stderr.write(`\n${cov.length} covered: ${cov.map(([k]) => k).join(', ')}\n${non.length} not yet: ${non.map(([k]) => k).join(', ')}\n`);
