// Orchestrator: runs the pipeline stages in order.
//   1. combine-ttl     — merge per-feed TTLs into combined.ttl (skips if combined.ttl exists)
//   2. ttl-to-json     — emit data/protocols/<slug>.json for every protocol with TTL
//   3. build-index     — emit data/index.json (feeds + protocols + coverage matrix)

import { run as combineTtl } from './combine-ttl.mjs';
import { run as ttlToJson  } from './ttl-to-json.mjs';
import { run as buildIndex } from './build-index.mjs';

console.log('# combine-ttl');
await combineTtl();

console.log('\n# ttl-to-json');
const written = await ttlToJson();

console.log('\n# build-index');
await buildIndex();

console.log(`\ndone — ${written} per-protocol JSON file(s) + data/index.json`);
