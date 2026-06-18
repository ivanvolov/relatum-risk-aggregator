#!/usr/bin/env node
// Runs the DeFiPunk'd API adapter against the 20 seed protocols.
// Writes one merged JSON per Relatum protocol slug.
import { getAssessment } from './defipunkd.mjs';
import { writeFile } from 'fs/promises';

// Relatum slug → list of DeFiPunk'd slugs to try (multi-deployment protocols
// have several; we keep whichever the API returns data for).
const MAP = {
  aave:       ['aave-v3', 'aave'],
  morpho:     ['morpho-blue', 'morpho'],
  sky:        ['sky-lending', 'sky-money', 'sky-rwa'],
  spark:      ['sparklend'],
  ethena:     ['ethena-usde'],
  lido:       ['lido'],
  uniswap:    ['uniswap-v4'],
  curve:      ['curve-dex', 'curve-llamalend', 'crvusd'],
  compound:   ['compound-v3', 'compound-finance', 'compound'],
  rocketpool: ['rocket-pool'],
  pendle:     ['pendle'],
  liquity:    ['liquity-v1', 'liquity-v2'],
  balancer:   ['balancer-v3', 'balancer-v2'],
  etherfi:    ['ether.fi-stake', 'etherfi-stake'],
  fluid:      ['fluid', 'fluid-lending', 'instadapp'],
  yearn:      ['yearn-finance', 'yearn'],
  euler:      ['euler-v2', 'euler'],
  mellow:     ['mellow', 'mellow-protocol'],
  gearbox:    ['gearbox', 'gearbox-v3'],
  cowswap:    ['cow-swap', 'cow-protocol', 'cowswap'],
};

const SLICES = ['verifiability', 'control', 'ability-to-exit', 'autonomy', 'open-access'];

const out = {};
for (const [relatumSlug, candidates] of Object.entries(MAP)) {
  process.stderr.write(`${relatumSlug.padEnd(12)} `);
  const deployments = [];
  for (const dpSlug of candidates) {
    const a = await getAssessment(dpSlug);
    const got = SLICES.filter((s) => !a.slices[s]?.error);
    if (got.length > 0 || a.snapshot) {
      deployments.push({
        defipunkd_slug: dpSlug,
        name: a.snapshot?.name || dpSlug,
        tvl: a.snapshot?.tvl || null,
        slices_available: got,
        slices_missing: SLICES.filter((s) => !got.includes(s)),
        grades: Object.fromEntries(
          got.map((s) => [s, {
            grade: a.slices[s].consensus_grade,
            strength: a.slices[s].consensus_strength,
            headline: a.slices[s].short_headline,
            merged_from: (a.slices[s].merged_from || []).length,
          }])
        ),
      });
      process.stderr.write(`✓${dpSlug}(${got.length}/5) `);
    } else {
      process.stderr.write(`·${dpSlug} `);
    }
  }
  out[relatumSlug] = deployments;
  process.stderr.write('\n');
}

const path = 'top20-defipunkd-2026-06-16.json';
await writeFile(path, JSON.stringify(out, null, 2));
process.stderr.write(`\nwrote ${path}\n`);

// Summary
const covered = Object.entries(out).filter(([, ds]) => ds.length > 0 && ds.some((d) => d.slices_available.length > 0));
const partial = covered.filter(([, ds]) => ds.some((d) => d.slices_available.length < 5));
const full = covered.filter(([, ds]) => ds.some((d) => d.slices_available.length === 5));
const none = Object.entries(out).filter(([, ds]) => ds.length === 0 || !ds.some((d) => d.slices_available.length > 0));
process.stderr.write(`\nSummary:\n  ${full.length} protocols with ≥1 deployment fully assessed (5/5)\n  ${covered.length - full.length} with partial coverage\n  ${none.length} with no DeFiPunk'd assessment yet (${none.map(([k]) => k).join(', ')})\n`);
