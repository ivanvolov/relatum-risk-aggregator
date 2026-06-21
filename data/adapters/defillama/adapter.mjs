#!/usr/bin/env node
// DefiLlama metadata adapter — api.llama.fi/protocol/<slug>.
//
// Not a risk/rating feed — a metadata source for protocol-level fields
// (description, category, audits, twitter, github, parent protocol, chains).
// The build pipeline reads this snapshot to fill the per-protocol JSON's
// `description` (and could fill more later) instead of the hand-curated
// `_prose.yaml` overlay. Adapter-sourced descriptions cover all 23 protocols
// in one fetch; the _prose.yaml overlay only had aave-v3.
//
// Endpoint:
//   GET https://api.llama.fi/protocol/<defillama-slug>
//   → { name, description, logo, category, audits, audit_links, audit_note,
//       twitter, url, github, chains, parentProtocol, hallmarks, methodology,
//       methodologyURL, governanceID, tvl: [...], chainTvls: {...}, ... }
//
// Slug map below is derived from our registry's logoUrl values (DefiLlama
// icons live at icons.llamao.fi/icons/protocols/<defillama-slug>.{png|jpg}).

const BASE = 'https://api.llama.fi/protocol';

// our slug → defillama slug
const SLUG_MAP = {
  'lido':          'lido',
  'aave':          'aave-v3',
  'spark':         'sparklend',
  'sky':           'sky-lending',
  'ethena':        'ethena-usde',
  'morpho':        'morpho-blue',
  'etherfi':       'ether.fi',
  'uniswap':       'uniswap-v3',
  'curve':         'curve-dex',
  'compound':      'compound-v3',
  'rocketpool':    'rocket-pool',
  'pendle':        'pendle',
  'fluid':         'fluid-lending',
  'liquity':       'liquity-v2',
  'yearn':         'yearn-finance',
  'euler':         'euler-v2',
  'mellow':        'mellow-protocol',
  'morpho-vaults': 'morpho-blue',
  'balancer':      'balancer-v3',
  'gearbox':       'gearbox',
  'cowswap':       'cowswap',
  '1inch':         '1inch',
  '0x':            'matcha',
};

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// Derive a clean chain list from currentChainTvls when `chains` is empty.
// DefiLlama uses suffixed keys like "Ethereum-staking", "Base-borrowed";
// strip the suffix and dedupe to the base chain name. Pure chains like
// "staking"/"borrowed"/"pool2" (no chain prefix) are filtered out.
const TVL_SUFFIXES = ['-staking','-borrowed','-pool2','-treasury','-vesting'];
const NON_CHAIN_KEYS = new Set(['staking','borrowed','pool2','treasury','vesting']);
function chainsFromTvls(currentChainTvls) {
  if (!currentChainTvls) return [];
  const out = new Set();
  for (const key of Object.keys(currentChainTvls)) {
    if (NON_CHAIN_KEYS.has(key)) continue;
    let chain = key;
    for (const sfx of TVL_SUFFIXES) {
      if (chain.endsWith(sfx)) { chain = chain.slice(0, -sfx.length); break; }
    }
    if (chain && !NON_CHAIN_KEYS.has(chain)) out.add(chain);
  }
  return [...out];
}

// Pluck only the fields we care about. Drops the TVL time series (large) and
// other UI-only fields. Keeps everything that might enrich a protocol page.
function project(raw) {
  if (!raw) return null;
  const chains = (raw.chains && raw.chains.length) ? raw.chains : chainsFromTvls(raw.currentChainTvls);
  return {
    name: raw.name ?? null,
    description: raw.description ?? null,
    category: raw.category ?? null,
    url: raw.url ?? null,
    twitter: raw.twitter ?? null,
    github: Array.isArray(raw.github) ? raw.github : (raw.github ? [raw.github] : []),
    audits: raw.audits != null ? Number(raw.audits) : null,
    audit_note: raw.audit_note ?? null,
    audit_links: raw.audit_links ?? [],
    chains,
    parent_protocol: raw.parentProtocol ?? null,
    governance_id: raw.governanceID ?? null,
    methodology: raw.methodology ?? null,
    methodology_url: raw.methodologyURL ?? null,
    hallmarks: raw.hallmarks ?? [],
    listed_at: raw.listedAt ?? null,
    forked_from: raw.forkedFrom ?? [],
    tvl_usd: raw.currentChainTvls
      ? Object.values(raw.currentChainTvls).reduce((a, b) => a + Number(b || 0), 0)
      : null,
  };
}

export async function getProtocol(slug) {
  const llamaSlug = SLUG_MAP[slug];
  if (!llamaSlug) return { slug, covered: false, reason: 'no DefiLlama slug mapping' };
  try {
    const raw = await fetchJSON(`${BASE}/${encodeURIComponent(llamaSlug)}`);
    const meta = project(raw);
    if (!meta || !meta.name) return { slug, covered: false, reason: `DefiLlama returned no metadata for ${llamaSlug}` };
    return { slug, llama_slug: llamaSlug, covered: true, ...meta };
  } catch (e) {
    return { slug, llama_slug: llamaSlug, covered: false, reason: `fetch failed: ${e.message}` };
  }
}

export const KNOWN_SLUGS = Object.keys(SLUG_MAP);

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'protocol') {
    const slugs = args.length ? args : KNOWN_SLUGS;
    const out = { fetched_at: new Date().toISOString(), protocols: {} };
    for (const slug of slugs) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out.protocols[slug] = p;
      process.stderr.write(p.covered ? `${p.name} (${p.description?.slice(0, 60) || 'no desc'}...)\n` : `— ${p.reason}\n`);
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: defillama/adapter.mjs protocol [slug ...]');
    process.exit(1);
  }
}
