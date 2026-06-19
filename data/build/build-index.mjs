// Emit data/out/index.json — feed registry + protocol list + coverage matrix.
// Coverage per (protocol, feed) comes from the per-protocol JSONs already emitted by ttl-to-json.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FEED_REGISTRY, PROTOCOLS } from './lib/registry.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ADAPTERS = path.join(ROOT, 'data', 'adapters');
const FEEDS_DIR = path.join(ROOT, 'public', 'data', 'feeds');

// adapterStatus = implemented when feeds-to-json has produced a normalized JSON for the feed.
// (Replaces the older existsSync(to-ttl.mjs) check — the JSON is now the source of truth.)
const adapterImplemented = (feedId) => existsSync(path.join(FEEDS_DIR, `${feedId}.json`));

async function coverageFromJson(slug) {
  const jsonPath = path.join(ROOT, 'public', 'data', 'protocols', `${slug}.json`);
  if (!existsSync(jsonPath)) return null;
  const proto = JSON.parse(await readFile(jsonPath, 'utf8'));
  const row = {};
  for (const f of proto.feeds || []) {
    row[f.feedId] = { status: f.status, adapterStatus: f.adapterStatus, inline: f.inline ?? null };
  }
  return row;
}

export async function run() {
  const feeds = FEED_REGISTRY.map(f => ({
    ...f,
    schemaDoc: existsSync(path.join(ADAPTERS, f.id, 'schema.yaml')) ? `data/adapters/${f.id}/schema.yaml` : null,
    adapterStatus: adapterImplemented(f.id) ? 'implemented' : 'pending',
  }));

  const coverage = {};
  for (const p of PROTOCOLS) {
    const row = await coverageFromJson(p.slug);
    if (!row) {
      console.warn(`  WARN: no data/out/protocols/${p.slug}.json — skipping coverage row`);
      coverage[p.slug] = {};
      continue;
    }
    coverage[p.slug] = row;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    feeds,
    protocols: PROTOCOLS,
    coverage,
  };

  const outPath = path.join(ROOT, 'public', 'data', 'index.json');
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2));
  const implementedCount = feeds.filter(f => f.adapterStatus === 'implemented').length;
  console.log(`  wrote ${path.relative(ROOT, outPath)}  (${PROTOCOLS.length} protocols × ${feeds.length} feeds, ${implementedCount} adapter(s) implemented)`);
}

import { fileURLToPath } from 'node:url';
if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('build-index');
  await run();
}
