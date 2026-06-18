#!/usr/bin/env node
// Block Analitica adapter — per-protocol REST APIs (public, no auth).
//
// Block Analitica runs per-protocol dashboards backed by separate API hosts.
// Discovered 2026-06-17 via headless sniff of each .blockanalitica.com
// subdomain. Confirmed live and CORS-open as of fetch time:
//
//   morpho   → morpho-api.blockanalitica.com/             (root JSON)
//   spark    → spark-api.blockanalitica.com/v1/ethereum/markets/stats/
//   compound → compound-api.blockanalitica.com/v3/        (root JSON) + /v3/markets/
//   sky      → info-sky.blockanalitica.com/overall/       (Sky dashboard lives at info.sky.money)
//   ajna     → ajna-api.blockanalitica.com/v4/overall/    (not in seed top20)
//   hyperdrive → hyperdrive-api.blockanalitica.com/       (not in seed top20)
//
// Deprecated / decommissioned (DNS NXDOMAIN as of 2026-06-17):
//   aave.blockanalitica.com — BA no longer maintains an Aave dashboard.
//     BA's marketing copy currently names Sky, Spark, Morpho, Summer.fi
//     (no Aave).
//
// Sky's dashboard is hosted at sky.money but the data flow is identical
// to the other BA dashboards (same SimpleAnalytics tag, same Plus Jakarta
// font, hostname_original=info.skyeco.com).

const PROTOCOL_HOSTS = {
  morpho:    { stats: 'https://morpho-api.blockanalitica.com/?days_ago=1' },
  spark:     { stats: 'https://spark-api.blockanalitica.com/v1/ethereum/markets/stats/?days_ago=1', markets: 'https://spark-api.blockanalitica.com/v1/ethereum/markets/?days_ago=1' },
  compound:  { stats: 'https://compound-api.blockanalitica.com/v3/', markets: 'https://compound-api.blockanalitica.com/v3/markets/' },
  sky:       { stats: 'https://info-sky.blockanalitica.com/overall/?days_ago=1', extras: ['https://info-sky.blockanalitica.com/save/?days_ago=1', 'https://info-sky.blockanalitica.com/revenue/'] },
};

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

export function supportedProtocols() {
  return Object.keys(PROTOCOL_HOSTS);
}

export async function getProtocol(slug) {
  const cfg = PROTOCOL_HOSTS[slug];
  if (!cfg) return { slug, covered: false, reason: 'no Block Analitica dashboard for this protocol' };
  try {
    const stats = await fetchJSON(cfg.stats);
    const out = { slug, covered: true, stats_url: cfg.stats, stats };
    if (cfg.markets) {
      try {
        const m = await fetchJSON(cfg.markets);
        out.markets_url = cfg.markets;
        out.markets_count = (m.results || m.data?.results || (Array.isArray(m) ? m : null))?.length ?? null;
      } catch (e) { out.markets_error = e.message; }
    }
    if (cfg.extras) {
      out.extras = {};
      for (const u of cfg.extras) {
        try { out.extras[u] = await fetchJSON(u); } catch (e) { out.extras[u] = { error: e.message }; }
      }
    }
    return out;
  } catch (e) {
    return { slug, covered: false, error: e.message, attempted: cfg.stats };
  }
}

import { fileURLToPath } from 'node:url';
const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    console.log('# Block Analitica covers:');
    for (const p of supportedProtocols()) console.log(p);
  } else if (cmd === 'protocol') {
    const out = {};
    for (const slug of args) {
      process.stderr.write(`→ ${slug} ... `);
      const p = await getProtocol(slug);
      out[slug] = p;
      process.stderr.write(p.covered ? 'ok\n' : 'not covered\n');
    }
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('usage: blockanalitica.mjs list | protocol <slug> [slug ...]');
    process.exit(1);
  }
}
