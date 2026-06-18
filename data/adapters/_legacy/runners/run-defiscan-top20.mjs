#!/usr/bin/env node
import { getProtocol, listProtocols } from './defiscan.mjs';
import { writeFile } from 'fs/promises';

const MAP = {
  aave:       ['aave'],
  morpho:     ['morpho'],
  sky:        ['sky'],
  spark:      ['spark'],
  ethena:     ['ethena'],
  lido:       ['lido-v2'],
  uniswap:    ['uniswap-v3', 'uniswap-v2'],
  curve:      ['curve-finance'],
  compound:   ['compound-v3', 'compound-v2'],
  pendle:     ['pendle'],
  liquity:    ['liquity'],
  rocketpool: [],
  balancer:   [],
  etherfi:    [], // there's an etherfi.md inside aave/, not its own dir
  fluid:      [],
  yearn:      [],
  euler:      [],
  mellow:     [],
  gearbox:    [],
  cowswap:    [],
};

const out = {};
for (const [relatumSlug, candidates] of Object.entries(MAP)) {
  process.stderr.write(`${relatumSlug.padEnd(12)} `);
  if (candidates.length === 0) {
    out[relatumSlug] = { covered: false, reason: 'not in DeFiScan registry' };
    process.stderr.write('— no DeFiScan dir\n');
    continue;
  }
  const deployments = [];
  for (const slug of candidates) {
    try {
      const p = await getProtocol(slug);
      const chains = Object.keys(p.chains).filter((c) => !p.chains[c].error);
      if (chains.length > 0) {
        deployments.push({
          defiscan_slug: slug,
          name: p.meta?.protocol || slug,
          website: p.meta?.website,
          defillama_slug: p.meta?.defillama_slug,
          chains: Object.fromEntries(chains.map((c) => [c, {
            stage: p.chains[c].stage,
            risks: p.chains[c].risks,
            publish_date: p.chains[c].publish_date,
          }])),
        });
      }
    } catch (e) {
      // skip
    }
  }
  out[relatumSlug] = { covered: deployments.length > 0, deployments };
  process.stderr.write(`${deployments.length} deployments\n`);
}

const path = 'defiscan-2026-06-17.json';
await writeFile(path, JSON.stringify(out, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

const cov = Object.entries(out).filter(([, v]) => v.covered);
const non = Object.entries(out).filter(([, v]) => !v.covered);
process.stderr.write(`\n${cov.length} covered: ${cov.map(([k]) => k).join(', ')}\n${non.length} not yet: ${non.map(([k]) => k).join(', ')}\n`);
