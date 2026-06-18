#!/usr/bin/env node
// DeFiScan adapter — github.com/deficollective/defiscan raw .md files.
//
// Endpoints (no auth, content-addressed via git):
//   1. List protocols:
//      GET api.github.com/repos/deficollective/defiscan/contents/src/content/protocols
//   2. Per-protocol metadata:
//      GET raw.githubusercontent.com/.../src/content/protocols/<slug>/data.json
//      → {id, protocol, website, defillama_slug, socials, github}
//   3. Per-chain assessment (markdown w/ YAML frontmatter):
//      GET raw.githubusercontent.com/.../src/content/protocols/<slug>/<chain>.md
//      → stage (0/1/2), risks [chain, upgrade, autonomy, exit, accessibility]
//        (each L/M/H), reasons, author, dates, stage_requirements
//
// Usage:
//   node defiscan.mjs list                  → all protocols
//   node defiscan.mjs get <slug>            → all chains for protocol
//   node defiscan.mjs get aave morpho ...   → batch

const GH = 'https://api.github.com/repos/deficollective/defiscan/contents/src/content/protocols';
const RAW = 'https://raw.githubusercontent.com/deficollective/defiscan/main/src/content/protocols';

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

// Minimal YAML frontmatter parser — extracts top-level scalar keys + the
// stage/risks/reasons arrays. Avoids needing a YAML dep.
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const yaml = m[1];
  const out = {};
  // simple scalar lines: `key: value` (quoted or not)
  for (const line of yaml.split('\n')) {
    const sm = line.match(/^(\w+):\s*"?([^"\n]*?)"?\s*$/);
    if (sm) out[sm[1]] = sm[2];
  }
  // risks array
  const rm = yaml.match(/risks:\s*\[([^\]]+)\]/);
  if (rm) out.risks = rm[1].split(',').map((s) => s.trim().replace(/"/g, ''));
  // stage as number
  if (out.stage !== undefined) out.stage = Number(out.stage);
  return out;
}

let _slugs;
export async function listProtocols() {
  if (!_slugs) {
    const dirs = await fetchJSON(GH);
    _slugs = dirs.filter((x) => x.type === 'dir').map((x) => x.name);
  }
  return _slugs;
}

export async function getProtocolMeta(slug) {
  try {
    return await fetchJSON(`${RAW}/${slug}/data.json`);
  } catch (e) {
    return { error: e.message };
  }
}

export async function getProtocolChains(slug) {
  const dirs = await fetchJSON(`${GH}/${slug}`);
  const mdFiles = dirs.filter((x) => x.name.endsWith('.md'));
  const chains = {};
  await Promise.all(mdFiles.map(async (f) => {
    const chain = f.name.replace('.md', '');
    try {
      const md = await fetchText(`${RAW}/${slug}/${f.name}`);
      const fm = parseFrontmatter(md);
      chains[chain] = fm || { error: 'no-frontmatter' };
    } catch (e) {
      chains[chain] = { error: e.message };
    }
  }));
  return chains;
}

export async function getProtocol(slug) {
  const [meta, chains] = await Promise.all([getProtocolMeta(slug), getProtocolChains(slug)]);
  return { slug, meta, chains };
}

// --- CLI ---
import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    const slugs = await listProtocols();
    console.log(`# ${slugs.length} protocols`);
    for (const s of slugs) console.log(s);
  } else if (cmd === 'get') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      const cs = Object.keys(p.chains).filter((c) => !p.chains[c].error);
      process.stderr.write(`${cs.length} chains: ${cs.join(',')}\n`);
      out[slug] = p;
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: defiscan.mjs list | get <slug> [slug ...]');
    process.exit(1);
  }
}
