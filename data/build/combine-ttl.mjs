// Scaffold: when per-feed TTLs are generated under ontology/protocols/<slug>/<feed>.ttl,
// this concatenates them into <slug>/combined.ttl. The existing aave-v3 already has a
// hand-curated combined.ttl — running this script on aave-v3 would overwrite it, so it's
// guarded behind --force.
//
// usage: node combine-ttl.mjs           (regenerates only protocols that don't already
//                                        have a combined.ttl)
//        node combine-ttl.mjs --force   (regenerates every protocol)

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ONT  = path.join(ROOT, 'data', 'ontology', 'protocols');

export async function run({ force = false } = {}) {
  const dirs = await readdir(ONT, { withFileTypes: true });
  let combined = 0;
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const slugDir = path.join(ONT, d.name);
    const combinedPath = path.join(slugDir, 'combined.ttl');
    if (existsSync(combinedPath) && !force) {
      console.log(`  skip ${d.name} (combined.ttl exists)`);
      continue;
    }
    const files = (await readdir(slugDir)).filter(f => f.endsWith('.ttl') && f !== 'combined.ttl');
    if (files.length === 0) {
      console.log(`  skip ${d.name} (no per-feed TTL)`);
      continue;
    }
    const chunks = await Promise.all(files.map(f => readFile(path.join(slugDir, f), 'utf8')));
    await writeFile(combinedPath, chunks.join('\n# ---\n'));
    console.log(`  wrote ${path.relative(ROOT, combinedPath)} (${files.length} per-feed TTLs)`);
    combined++;
  }
  return combined;
}

import { fileURLToPath } from 'node:url';
if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force');
  console.log('combine-ttl' + (force ? ' --force' : ''));
  await run({ force });
}
