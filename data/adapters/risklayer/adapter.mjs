#!/usr/bin/env node
// RiskLayer adapter — BLOCKED (product pivoted away from DeFi).
//
// Observed 2026-06-17 at https://www.risklayer.io:
//   The site has pivoted from "DeFi Risk Oracle AVS" (as described in the
//   RFP) to "INDUSTRY-FIRST VENDOR MAPPING — See Which Asset Managers Power
//   Your Carriers". It is now an RIA / insurance-broker tool tracking
//   shared asset-manager exposure across insurance carriers (Apollo →
//   Global Atlantic, Athene, Jackson, etc.).
//
//   The single-page React SPA contains no DeFi protocol references in its
//   247KB bundle (grep for aave/morpho/spark/etc. returned 0 matches).
//   No DeFi data, no /api endpoints, no methodology page surfaced.
//
// COVERAGE implication: every cell in the `risklayer` column for the 20
// seed protocols should be "none". The previous matrix had aave="part"
// and was already mostly "none" — correcting aave below.

export const STATUS = 'product_pivoted';
export const REASON = 'risklayer.io pivoted from DeFi Risk Oracle AVS to insurance-carrier vendor-mapping tool. No DeFi data on site.';

export async function listProtocols() { return []; }
export async function getProtocol() { return { error: REASON }; }

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  console.log(JSON.stringify({ status: STATUS, reason: REASON }, null, 2));
}
