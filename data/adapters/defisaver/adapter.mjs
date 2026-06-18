#!/usr/bin/env node
// DeFi Saver adapter — defisaver.com marketing pages (no public data API).
//
// DeFi Saver is a position-management UI, not a per-protocol risk feed. The
// only public surface that enumerates supported protocols is the marketing
// site. As of 2026-06-17, the canonical list is on the "Lending and
// Borrowing" feature page, in the FAQ block under "Which protocols are
// supported":
//
//   Aave (V3 / V4), Compound, Maker, Spark, Morpho, Fluid, Sky, Liquity,
//   CurveUSD, LlamaLend, Euler v2.
//
// No app API is exposed without a wallet session; the protocol list is the
// only structured signal we can extract publicly.

const FEATURE_URLS = {
  lending: 'https://defisaver.com/features/lending-and-borrowing',
  dex: 'https://defisaver.com/features/decentralised-exchange',
  leverage: 'https://defisaver.com/features/leverage-management',
};

const SLUG_KEYWORDS = {
  aave:       /\baave\b/i,
  compound:   /\bcompound\b/i,
  sky:        /\bsky\b|\bmaker\b/i,
  spark:      /\bspark\b/i,
  morpho:     /\bmorpho\b/i,
  fluid:      /\bfluid\b/i,
  liquity:    /\bliquity\b/i,
  curve:      /\bcurveusd\b|\bcurve\b|\bllamalend\b/i,
  euler:      /\beuler\b/i,
  lido:       /\blido\b/i,
  ethena:     /\bethena\b/i,
  etherfi:    /\bether\.?fi\b|\betherfi\b/i,
  uniswap:    /\buniswap\b/i,
  rocketpool: /\brocket ?pool\b/i,
  pendle:     /\bpendle\b/i,
  yearn:      /\byearn\b/i,
  mellow:     /\bmellow\b/i,
  balancer:   /\bbalancer\b/i,
  gearbox:    /\bgearbox\b/i,
  cowswap:    /\bcow ?swap\b/i,
};

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function stripToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
}

let _featureTexts;
async function getFeatureTexts() {
  if (_featureTexts) return _featureTexts;
  const entries = await Promise.all(Object.entries(FEATURE_URLS).map(async ([k, url]) => [k, stripToText(await fetchText(url))]));
  _featureTexts = Object.fromEntries(entries);
  return _featureTexts;
}

export async function getProtocol(slug) {
  const re = SLUG_KEYWORDS[slug];
  if (!re) return { slug, covered: false, reason: 'no keyword pattern' };
  const texts = await getFeatureTexts();
  const seenOn = [];
  for (const [feature, text] of Object.entries(texts)) {
    if (re.test(text)) seenOn.push(feature);
  }
  return { slug, covered: seenOn.length > 0, surfaces: seenOn };
}

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(p.covered ? `${p.surfaces.join(',')}\n` : '—\n');
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: defisaver.mjs protocol <slug> [slug ...]');
    process.exit(1);
  }
}
