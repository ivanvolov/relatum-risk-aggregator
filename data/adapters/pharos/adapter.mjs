#!/usr/bin/env node
// Pharos adapter — pharos.watch sitemap + per-stablecoin static profile.
//
// Two surfaces:
//   1. https://pharos.watch/sitemap.xml — canonical list of every covered
//      stablecoin (406 as of 2026-06-17). Each entry: /stablecoin/<slug>/
//      Free to fetch, no auth.
//   2. https://pharos.watch/stablecoin/<slug>/ — server-rendered static
//      profile (governance model, backing model, peg, jurisdiction,
//      collateral notes, AI summary). All visible text is in the HTML;
//      live "Safety Score" / depeg / liquidity charts hydrate from the
//      gated API.
//
// The richest live data lives behind https://api.pharos.watch/api/stablecoin/<slug>
// (returns 401 "X-API-Key required" — request self-serve access at
// pharos.watch/api/). The adapter prefers the public surface and degrades
// gracefully when the API is unavailable.
//
// Per the spec sitemap, our 20 Relatum seed protocols map like this:
//   sky      → usds-sky, susds-sky, sdai-sky, stusds-sky
//   aave     → gho-aave, sgho-aave, stkgho-umbrella-aave
//   liquity  → lusd-liquity, bold-liquity
//   ethena   → usde-ethena, susde-ethena, usdtb-ethena
//   curve    → crvusd-curve, scrvusd-curve
//   fluid    → dusd-fluid
//   spark    → susdc-spark, susdt-spark
// Remaining seed protocols don't issue stablecoins → not in Pharos.

const SITEMAP = 'https://pharos.watch/sitemap.xml';
const BASE = 'https://pharos.watch';

let _slugs;
export async function listStablecoinSlugs() {
  if (_slugs) return _slugs;
  const xml = await fetch(SITEMAP).then((r) => r.text());
  const slugs = [...xml.matchAll(/\/stablecoin\/([a-z0-9-]+)\//g)].map((m) => m[1]);
  _slugs = [...new Set(slugs)];
  return _slugs;
}

// Suffix-based protocol attribution: the slug pattern is `<symbol>-<issuer>`
// where `<issuer>` is the canonical protocol/entity name.
const ISSUER_TO_PROTOCOL = {
  sky: 'sky',
  aave: 'aave',
  'umbrella-aave': 'aave',
  liquity: 'liquity',
  ethena: 'ethena',
  curve: 'curve',
  fluid: 'fluid',
  spark: 'spark',
  yearn: 'yearn',
  makerdao: 'sky', // legacy MakerDAO branding rolled into Sky
};

export function classifySlug(slug) {
  // Try the longest matching issuer suffix first (so "umbrella-aave" beats "aave").
  const suffixes = Object.keys(ISSUER_TO_PROTOCOL).sort((a, b) => b.length - a.length);
  for (const issuer of suffixes) {
    if (slug.endsWith(`-${issuer}`)) return ISSUER_TO_PROTOCOL[issuer];
  }
  return null;
}

export async function getProtocol(slug) {
  const all = await listStablecoinSlugs();
  const matches = all.filter((s) => classifySlug(s) === slug);
  return {
    slug,
    covered: matches.length > 0,
    stablecoin_count: matches.length,
    stablecoins: matches.map((s) => ({ slug: s, page: `${BASE}/stablecoin/${s}/` })),
  };
}

// Static profile scrape — strips React server components down to the
// visible body text and pulls the chip values (governance / backing / peg).
export async function getStablecoinProfile(slug) {
  const html = await fetch(`${BASE}/stablecoin/${slug}/`).then((r) => r.text());
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
  // Find chip-like phrases sitting near "Static Profile"
  const profileMatch = text.match(/static profile: governance model ([^;]+); backing model ([^;]+); peg ([^.]+)\./i);
  return {
    slug,
    governance_model: profileMatch ? profileMatch[1].trim() : null,
    backing_model: profileMatch ? profileMatch[2].trim() : null,
    peg: profileMatch ? profileMatch[3].trim() : null,
    text_excerpt: text.slice(0, 1500),
  };
}

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    const slugs = await listStablecoinSlugs();
    console.log(`# ${slugs.length} stablecoins`);
    for (const s of slugs) console.log(`${s.padEnd(40)} → ${classifySlug(s) || '—'}`);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(`${p.stablecoin_count} stablecoins\n`);
    }
    console.log(JSON.stringify(out, null, 2));
  } else if (cmd === 'profile') {
    for (const slug of args) {
      const p = await getStablecoinProfile(slug);
      console.log(JSON.stringify(p, null, 2));
    }
  } else {
    console.error('usage: pharos.mjs list | protocol <slug> [slug ...] | profile <stablecoin-slug>');
    process.exit(1);
  }
}
