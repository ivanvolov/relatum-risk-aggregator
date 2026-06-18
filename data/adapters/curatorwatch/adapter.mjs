#!/usr/bin/env node
// CuratorWatch adapter — curatorwatch.com REST API (public, no auth).
//
// Endpoints discovered 2026-06-17 via headless sniff:
//   1. /api/curators
//      → {success, data:{curators:[...], stats, pagination}}
//      Each curator: {curatorId, name, jurisdiction, entityType, isRegulated,
//                     totalAUM, vaultCount, protocols:[...], gradeDistribution,
//                     engineRating, riskScore, strategyType, tvlChange30d, vaults:[...]}
//   2. /api/vaults
//      → {success, data:[...]} (no pagination as of 2026-06-17; 355 vaults total)
//      Each vault: {id, address, name, asset, curatorName, protocol,
//                   riskAssessment:{overallRisk, overallScore}, grade,
//                   gradeFailures:[...], warnings:[...], latestSnapshot:{...}}
//
// Underlying-protocol coverage (from `protocol` field across 355 vaults):
//   morpho(138), spark(7), sky(4), lido(5), euler(6), plus curator-native
//   strategies (k3, midas, 9summits, katana, re7, sierra, telosc, termmax,
//   trevee, falcon, mfarm) and 116 "unknown" (un-tagged Turtle vaults).
//
// Of the 20 Relatum seed protocols, CuratorWatch covers 5 as lending-rail
// underlyings: morpho, spark, sky, lido, euler.
//
// Usage:
//   node curatorwatch.mjs curators        → list curator names + key stats
//   node curatorwatch.mjs vaults          → vaults grouped by protocol
//   node curatorwatch.mjs protocol <slug> → all vaults whose `protocol` matches

const BASE = 'https://curatorwatch.com';

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const body = await r.json();
  if (!body.success) throw new Error(`unsuccessful: ${JSON.stringify(body).slice(0, 200)}`);
  return body.data;
}

let _curators;
export async function listCurators() {
  if (!_curators) {
    const d = await fetchJSON(`${BASE}/api/curators`);
    _curators = d.curators;
  }
  return _curators;
}

let _vaults;
export async function listVaults() {
  if (!_vaults) _vaults = await fetchJSON(`${BASE}/api/vaults`);
  return _vaults;
}

export async function getProtocol(slug) {
  const vaults = await listVaults();
  const matches = vaults.filter((v) => v.protocol === slug);
  if (matches.length === 0) return { slug, covered: false, vaults: [], curators: [] };
  const curatorNames = [...new Set(matches.map((v) => v.curatorName))];
  return {
    slug,
    covered: true,
    vault_count: matches.length,
    total_tvl_usd: matches.reduce((s, v) => s + (v.latestSnapshot?.totalAssetsUsd || 0), 0),
    avg_risk_score: avg(matches.map((v) => v.riskAssessment?.overallScore).filter(Number.isFinite)),
    grade_distribution: countBy(matches, 'grade'),
    risk_distribution: countBy(matches.map((v) => ({ k: v.riskAssessment?.overallRisk })), 'k'),
    curators: curatorNames,
    vaults: matches.map((v) => ({
      address: v.address,
      name: v.name,
      curator: v.curatorName,
      asset: v.asset?.symbol,
      chain: v.chainName,
      tvl_usd: v.latestSnapshot?.totalAssetsUsd,
      net_apy: v.latestSnapshot?.netApy,
      grade: v.grade,
      risk: v.riskAssessment?.overallRisk,
      risk_score: v.riskAssessment?.overallScore,
      grade_failures: v.gradeFailures,
    })),
  };
}

function avg(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }
function countBy(xs, key) {
  const out = {};
  for (const x of xs) { const k = x[key] || 'unknown'; out[k] = (out[k] || 0) + 1; }
  return out;
}

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'curators') {
    const cs = await listCurators();
    console.log(`# ${cs.length} curators`);
    for (const c of cs) {
      console.log(`${(c.name || '').padEnd(22)} ${(c.jurisdiction || '—').padEnd(18)} AUM=$${(c.totalAUM || 0).toLocaleString().padEnd(15)} vaults=${c.vaultCount} risk=${c.riskScore}`);
    }
  } else if (cmd === 'vaults') {
    const vs = await listVaults();
    const byProto = {};
    for (const v of vs) {
      const p = v.protocol || 'unknown';
      byProto[p] = (byProto[p] || 0) + 1;
    }
    console.log(`# ${vs.length} vaults by underlying protocol`);
    for (const [p, n] of Object.entries(byProto).sort((a, b) => b[1] - a[1])) {
      console.log(`${p.padEnd(15)} ${n}`);
    }
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      process.stderr.write(`${p.covered ? `${p.vault_count} vaults, ${p.curators.length} curators` : 'not covered'}\n`);
      out[slug] = p;
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: curatorwatch.mjs curators | vaults | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
