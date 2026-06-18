# DeFiScan adapter

DeFiScan ([defiscan.info](https://defiscan.info)) publishes Stage 0/1/2 decentralization classifications + a 5-axis L/M/H risk grid per protocol per chain. The source of truth is the JSON in `github.com/deficollective/defiscan-data`; the website is a renderer over it.

## Files

| File | Role |
|---|---|
| `adapter.mjs` | Scraper — pulls fresh JSON from the public source (or copies from a vendored mirror). Writes `output/<YYYY-MM-DD>.json`. Operator-run. |
| `schema.yaml` | Declared output shape for both the scrape JSON and what `to-ttl.mjs` consumes. Read by the registry on `methodology.html`. |
| `to-ttl.mjs` | Reads every `output/*.json` snapshot, emits per-protocol-per-date TTL fragments under `data/ontology/protocols/<slug>/defiscan.<date>.ttl`. Each rfp:Score / rfp:Rating / rfp:CoverageStatement carries `rfp:observedAt` set to the snapshot date — that's what feeds the history view. |
| `output/` | Dated raw scrape JSONs. Committed to the repo so the pipeline is fully re-derivable without re-running the scraper. |

## Quirks

- Aave-v3 is skipped by `to-ttl.mjs` (`SKIP_SLUGS = new Set(['aave'])`). The hand-curated `data/ontology/protocols/aave-v3/defiscan.ttl` already contains ~10 narrative `rfp:Finding` triples (Stage 0/1/2 requirements, permission scanner summary) that the scrape doesn't carry. Until the adapter learns to emit those, leave aave's hand-curated TTL alone.
- DefiScan's 5-axis risk array order is fixed at `[chain, upgradeability, autonomy, exit-window, accessibility]` per `defiscan.info/framework`. If they ever reshuffle, update `RISK_AXES` in `to-ttl.mjs`.
- Each chain in a deployment may have a different `stage`. The adapter currently extracts only the Ethereum chain (or the first chain if Ethereum isn't present); other chains are dropped. Multi-chain support would require additional `<slug>/<chain>` subject URIs.
- `covered: false` protocols (e.g., CoW Swap) emit a single `rfp:CoverageStatement notCovered` triple with the published reason.

## Re-run

From the repo root:

```bash
node data/adapters/defiscan/to-ttl.mjs   # regenerate TTL from existing output/*.json
node data/build/build-all.mjs            # then re-emit data/out/*
```

The scraper (`adapter.mjs`) is operator-run — kick it off when you want a fresh snapshot; it'll write a new `output/<today>.json` alongside the existing ones.
