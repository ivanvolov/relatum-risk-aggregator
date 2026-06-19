// Orchestrator: runs the pipeline stages in order.
//   1. combine-ttl     — merge per-feed TTLs into combined.ttl (skips if combined.ttl exists)
//   2. feeds-to-json   — emit public/data/feeds/<feedId>.json per implemented adapter
//   3. ttl-to-json     — emit public/data/protocols/<slug>.json (feed JSON overrides TTL/seed)
//   4. build-index     — emit public/data/index.json (feeds + protocols + coverage matrix)

import { run as combineTtl }  from './combine-ttl.mjs';
import { run as feedsToJson } from './feeds-to-json.mjs';
import { run as ttlToJson  }  from './ttl-to-json.mjs';
import { run as buildIndex }  from './build-index.mjs';

console.log('# combine-ttl');
await combineTtl();

console.log('\n# feeds-to-json');
await feedsToJson();

console.log('\n# ttl-to-json');
const written = await ttlToJson();

console.log('\n# build-index');
await buildIndex();

console.log(`\ndone — ${written} per-protocol JSON file(s) + data/index.json`);
