// Orchestrator: runs the pipeline stages in order.
//   1. feeds-to-json     — emit public/data/feeds/<feedId>.json per implemented adapter
//   2. protocols-to-json — emit public/data/protocols/<slug>.json (feed JSON + DefiLlama metadata)
//   3. build-index       — emit public/data/index.json (feeds + protocols + coverage matrix)
//   4. coverage-report   — emit COVERAGE.md at repo root (per-feed cov / not-cov audit)
//
// The ontology / TTL / hand-curated _prose.yaml pipeline lives in `_ontology/` —
// parked half-baked work that a future script will reconstruct from the live data
// produced by this pipeline. The live pipeline no longer reads any of it.

import { run as feedsToJson }    from './feeds-to-json.mjs';
import { run as ttlToJson  }     from './protocols-to-json.mjs';
import { run as buildIndex }     from './build-index.mjs';
import { run as coverageReport } from './coverage-report.mjs';

console.log('# feeds-to-json');
await feedsToJson();

console.log('\n# protocols-to-json');
const written = await ttlToJson();

console.log('\n# build-index');
await buildIndex();

console.log('\n# coverage-report');
await coverageReport();

console.log(`\ndone — ${written} per-protocol JSON file(s) + data/index.json + COVERAGE.md`);
