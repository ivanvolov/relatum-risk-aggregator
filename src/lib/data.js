// Async fetchers for the static JSON the build pipeline emits into public/data/.
// In dev Vite serves public/ at /; in production GH Pages serves it under base /relatum-risk-aggregator/.
// import.meta.env.BASE_URL handles both transparently.

const BASE = import.meta.env.BASE_URL;
const indexCache = { promise: null, value: null };
const detailCache = new Map();

export async function loadIndex() {
  if (indexCache.value) return indexCache.value;
  if (!indexCache.promise) {
    indexCache.promise = fetch(`${BASE}data/index.json`).then(r => {
      if (!r.ok) throw new Error(`failed to load data/index.json (${r.status})`);
      return r.json();
    }).then(idx => {
      idx.feedById = (id) => idx.feeds.find(f => f.id === id);
      indexCache.value = idx;
      return idx;
    });
  }
  return indexCache.promise;
}

export async function loadProtocol(slug) {
  if (detailCache.has(slug)) return detailCache.get(slug);
  const promise = fetch(`${BASE}data/protocols/${slug}.json`).then(r => r.ok ? r.json() : null);
  detailCache.set(slug, promise);
  return promise;
}
