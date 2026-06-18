#!/usr/bin/env node
// LlamaRisk adapter — Substack archive as the public research index.
//
// LlamaRisk publishes its public research at llamarisk.substack.com. Their
// marketing site (llamarisk.com) has no research index, and their dashboard
// (dashboard.llamarisk.com) is gated. Substack exposes a clean JSON API:
//
//   GET https://llamarisk.substack.com/api/v1/archive?sort=new&offset=N&limit=20
//   → array of post objects (each: {slug, title, subtitle, post_date,
//                                   canonical_url, search_engine_description, ...})
//
// `limit` is capped at 20. Paginate by incrementing `offset` by 20 until an
// empty batch comes back. As of 2026-06-17, the archive has 87 posts going
// back to 2021-12-24.
//
// Coverage caveat: LlamaRisk also publishes governance-forum reports on
// protocol-specific forums (Aave, Compound, Spark, Lido, etc.) that are not
// listed on Substack. This adapter's `getProtocol` only reflects Substack
// evidence; absence here is not absence of LlamaRisk coverage overall.

const ARCHIVE = 'https://llamarisk.substack.com/api/v1/archive';

let _posts;
export async function listPosts() {
  if (_posts) return _posts;
  const all = [];
  for (let offset = 0; offset < 1000; offset += 20) {
    const r = await fetch(`${ARCHIVE}?sort=new&offset=${offset}&limit=20`);
    if (!r.ok) throw new Error(`${r.status} archive offset=${offset}`);
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 20) break;
  }
  _posts = all.map((p) => ({
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle || '',
    description: p.search_engine_description || '',
    post_date: p.post_date,
    url: p.canonical_url,
  }));
  return _posts;
}

// Substring-based protocol attribution against post title + subtitle + SEO
// description. Patterns include token tickers because most posts reference
// the token rather than the protocol name.
const PROTOCOL_PATTERNS = {
  lido:       /\blido\b|\bstETH\b|\bwstETH\b/i,
  aave:       /\baave\b|\bGHO\b/i,
  spark:      /\bspark\b|\bsDAI\b/i,
  sky:        /\bsky\b|\bMakerDAO\b|\bMaker\b|\bDAI\b/i,
  ethena:     /\bethena\b|\bsUSDe\b|\bUSDe\b/i,
  morpho:     /\bmorpho\b/i,
  etherfi:    /\bether\.?fi\b|\beETH\b|\bweETH\b/i,
  uniswap:    /\buniswap\b/i,
  curve:      /\bcurve\b|\bcrvUSD\b|\bCRV\b|\bLlamaLend\b/i,
  compound:   /\bcompound\b|\bcUSDC\b/i,
  rocketpool: /\brocket ?pool\b|\brETH\b/i,
  pendle:     /\bpendle\b/i,
  fluid:      /\bfluid\b/i,
  liquity:    /\bliquity\b|\bLUSD\b|\bBOLD\b/i,
  yearn:      /\byearn\b|\byv[A-Z]+\b/,
  euler:      /\beuler\b/i,
  mellow:     /\bmellow\b/i,
  balancer:   /\bbalancer\b/i,
  gearbox:    /\bgearbox\b/i,
  cowswap:    /\bcow ?swap\b/i,
};

export async function getProtocol(slug) {
  const posts = await listPosts();
  const re = PROTOCOL_PATTERNS[slug];
  if (!re) return { slug, covered: false, reason: 'no pattern for slug' };
  const matches = posts.filter((p) => re.test(`${p.title} ${p.subtitle} ${p.description}`));
  return {
    slug,
    covered: matches.length > 0,
    post_count: matches.length,
    first_post_date: matches.at(-1)?.post_date?.slice(0, 10),
    latest_post_date: matches[0]?.post_date?.slice(0, 10),
    posts: matches.map((p) => ({ slug: p.slug, title: p.title, post_date: p.post_date?.slice(0, 10), url: p.url })),
  };
}

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    const ps = await listPosts();
    console.log(`# ${ps.length} substack posts`);
    for (const p of ps) console.log(`${p.post_date?.slice(0, 10)} ${p.title}`);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(`${p.post_count || 0} posts\n`);
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: llamarisk.mjs list | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
