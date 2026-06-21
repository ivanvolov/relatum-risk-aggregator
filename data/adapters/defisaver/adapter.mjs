#!/usr/bin/env node
// DeFi Saver adapter — public assets from defisaver.com + app.defisaver.com.
//
// DeFi Saver is a position-management UI. No public data API exists for the
// rated/scored shape other risk feeds use. Two public signals we extract:
//
//   1. Feature-page surface coverage (which of lending / dex / leverage the
//      protocol appears on) from defisaver.com/features/*. Binary per surface.
//
//   2. Per-protocol market COUNT — distinct `/protocol/<version>/<market>/manage`
//      routes in the public app bundle at app.defisaver.com. Each route
//      represents a distinct position-management target inside DeFi Saver
//      (e.g. aave-v3-core, aave-v3-etherfi, compound-v3-usdc, etc.). This
//      mirrors how DeFi Sphere counts markets — it's the most-honest number
//      we can derive from DeFi Saver's own public surface.

const FEATURE_URLS = {
  lending: 'https://defisaver.com/features/lending-and-borrowing',
  dex: 'https://defisaver.com/features/decentralised-exchange',
  leverage: 'https://defisaver.com/features/leverage-management',
};

const APP_SHELL = 'https://app.defisaver.com';

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

// Per-protocol prefixes for matching `/<prefix>/.../manage` routes in the bundle.
// Multiple prefixes map to one slug (e.g. sky and maker both → 'sky').
const SLUG_ROUTE_PREFIXES = {
  aave:     ['aave'],
  spark:    ['spark'],
  morpho:   ['morpho'],
  fluid:    ['fluid'],
  compound: ['compound'],
  liquity:  ['liquity'],
  sky:      ['sky', 'makerdao', 'maker'],
  curve:    ['curve', 'crvusd', 'llamalend'],
  euler:    ['euler'],
};

let _appBundleText;
async function getAppBundleText() {
  if (_appBundleText !== undefined) return _appBundleText;
  try {
    const shell = await fetchText(APP_SHELL);
    const m = shell.match(/src="(\/[^"]+\.js)"/);
    if (!m) { _appBundleText = null; return null; }
    _appBundleText = await fetchText(APP_SHELL + m[1]);
    return _appBundleText;
  } catch {
    _appBundleText = null;
    return null;
  }
}

// Extract distinct manage-routes per protocol slug from the public app bundle.
// Returns { <ourSlug>: ['/aave/smart-wallet/v3/etherfi/manage', ...] }
async function getMarketRoutes() {
  const text = await getAppBundleText();
  if (!text) return {};
  // Match any quoted path that ends in /manage and starts with a known prefix.
  const all = new Set([...text.matchAll(/"\/?([a-z][a-z0-9_/-]+\/manage)"/g)].map((m) => m[1]));
  const out = {};
  for (const [slug, prefixes] of Object.entries(SLUG_ROUTE_PREFIXES)) {
    const matches = [...all].filter((r) => prefixes.some((p) => r === `${p}/manage` || r.startsWith(`${p}/`)));
    if (matches.length) out[slug] = matches.sort();
  }
  return out;
}

export async function getProtocol(slug) {
  const re = SLUG_KEYWORDS[slug];
  if (!re) return { slug, covered: false, reason: 'no keyword pattern' };
  const texts = await getFeatureTexts();
  const seenOn = [];
  for (const [feature, text] of Object.entries(texts)) {
    if (re.test(text)) seenOn.push(feature);
  }
  const routes = (await getMarketRoutes())[slug] || [];
  return {
    slug,
    covered: seenOn.length > 0,
    surfaces: seenOn,
    market_count: routes.length,
    markets: routes,
  };
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
