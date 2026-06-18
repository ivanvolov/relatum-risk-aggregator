#!/usr/bin/env node
// Philidor adapter — BLOCKED (no public API).
//
// Investigated 2026-06-17:
//   - analytics.philidor.io: Next.js SSR + RSC. Sniff (sniff-philidor-v2.mjs)
//     captured 44 network requests on first paint; ALL were static assets
//     (_next/static/chunks/*.js, /protocols/*.svg, fonts). No data API call.
//   - vaults.philidor.io: client-side fetches blue-api.morpho.org/graphql
//     (Morpho's API) + coins.llama.fi/prices. No philidor.io data endpoint.
//   - api.philidor.io: returns 404 on /, /api/docs, /api/v1, /api/vaults,
//     /api/score, /api/protocols (probed manually).
//   - docs.philidor.io: redirects to /docs (HTML), no machine-readable API
//     reference exposed at /api or /api/api-reference (both 404).
//
// What this means for COVERAGE:
//   The analytics.philidor.io landing page renders protocol icons for
//   morpho, aave, spark, nest, compound, uniswap, maker, yearn, beefy.
//   That's the only signal we can extract without rendering the page in
//   a headless browser and parsing the vault DOM — which exceeds the
//   per-feed time budget. Leaving COVERAGE matrix as data.js had it
//   (the 5 overlap of that protocol-icon list with the 20 seed protocols:
//   morpho, aave, spark, compound, uniswap → already marked "part").
//
// If/when philidor publishes a public API, the right shape is:
//   listVaults() → [{ vaultAddress, protocol, curator, score, ... }]
//   getProtocolScores(slug) → aggregate per-protocol roll-up

export const STATUS = 'blocked';
export const REASON = 'No public API; vault scores computed client-side from Morpho GraphQL + on-chain data.';
export const KNOWN_PROTOCOLS_ON_LANDING = [
  'morpho', 'aave', 'spark', 'nest', 'compound', 'uniswap', 'maker', 'yearn', 'beefy',
];

export async function listProtocols() { return []; }
export async function getProtocol() { return { error: REASON }; }

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  console.log(JSON.stringify({ status: STATUS, reason: REASON, protocols_on_landing: KNOWN_PROTOCOLS_ON_LANDING }, null, 2));
}
