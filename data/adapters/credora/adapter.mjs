#!/usr/bin/env node
// Credora adapter — reports.credora.io XML index (public, no auth).
//
// Discovered 2026-06-17: the Credora marketing site (credora.io) is a
// brochure; its rating app (app.credora.io) requires login and the rating
// API requires self-serve key approval (per the homepage CTA "Request API
// Access"). However, the published-reports archive is an open XML index:
//
//   GET https://reports.credora.io/index.xml
//   → <reports generated="..."><report><url/><protocol/><filename/><date/></report> …
//
// Each PDF is fetchable directly. The protocol field is the canonical
// Credora protocol slug. As of 2026-06-17, the index lists 4 protocols
// with at least one published report:
//   listadao, lotus, spark (17 reports), steth (1 — Lido stETH)
//
// The marketing homepage claims "108 Rated Vaults, 177 Markets, 51 Assets"
// — that wider universe is behind the app, not in this index.

const INDEX = 'https://reports.credora.io/index.xml';

let _index;
async function getIndex() {
  if (_index) return _index;
  const xml = await fetch(INDEX).then((r) => r.text());
  const reports = [...xml.matchAll(/<report>\s*<url>([^<]+)<\/url>\s*<protocol>([^<]+)<\/protocol>\s*<filename>([^<]+)<\/filename>\s*<date>([^<]+)<\/date>\s*<\/report>/g)]
    .map((m) => ({ url: m[1], protocol: m[2], filename: m[3], date: m[4] }));
  const generated = xml.match(/<reports generated="([^"]+)"/)?.[1];
  _index = { generated, reports };
  return _index;
}

export async function listReports() { return (await getIndex()).reports; }
export async function listProtocols() {
  const reports = await listReports();
  return [...new Set(reports.map((r) => r.protocol))];
}

// Map Relatum slugs → Credora report protocol identifiers.
const PROTOCOL_MAP = {
  spark:    'spark',
  lido:     'steth',          // Credora indexes Lido under the stETH report family
  // Everything else is not in the public reports index.
  sky:        null, aave: null, morpho: null, compound: null, euler: null,
  curve:      null, fluid: null, gearbox: null, uniswap: null, ethena: null,
  etherfi:    null, liquity: null, yearn: null, mellow: null, balancer: null,
  cowswap:    null, pendle: null, rocketpool: null,
};

export async function getProtocol(slug) {
  const credoraSlug = PROTOCOL_MAP[slug];
  if (!credoraSlug) return { slug, covered: false, reason: 'not in public reports index' };
  const reports = (await listReports()).filter((r) => r.protocol === credoraSlug);
  return {
    slug,
    credora_protocol: credoraSlug,
    covered: reports.length > 0,
    report_count: reports.length,
    latest_report_date: reports.sort((a, b) => b.date.localeCompare(a.date))[0]?.date,
    reports: reports.map((r) => ({ date: r.date, filename: r.filename, url: r.url })),
  };
}

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    const idx = await getIndex();
    console.log(`# ${idx.reports.length} reports (generated ${idx.generated})`);
    const counts = {};
    for (const r of idx.reports) counts[r.protocol] = (counts[r.protocol] || 0) + 1;
    for (const [p, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`${p.padEnd(20)} ${n}`);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(p.covered ? `${p.report_count} reports\n` : '—\n');
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: credora.mjs list | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
