import { readFile } from 'node:fs/promises';
import { Parser, Store } from 'n3';
import { A, LABEL, P, T, feedUriToId, STATUS_FROM_TTL, pickBestStatus } from './ns.mjs';

export async function loadStore(...paths) {
  const store = new Store();
  for (const p of paths) {
    const text = await readFile(p, 'utf8');
    const quads = new Parser().parse(text);
    store.addQuads(quads);
  }
  return store;
}

const litVal = (term) => term?.termType === 'Literal' ? term.value : term?.value ?? '';
const objOf = (store, s, p) => store.getQuads(s, p, null)[0]?.object;
const objsOf = (store, s, p) => store.getQuads(s, p, null).map(q => q.object);

const guessLevel = (value, scale) => {
  const v = String(value).toLowerCase();
  if (/^h$|high|red/.test(v)) return 'high';
  if (/^m$|med|orange/.test(v)) return 'med';
  if (/^l$|low|green/.test(v)) return 'low';
  const lo = String(scale || '').toLowerCase();
  if (/(letter|a\+\.\.d|stage)/.test(lo) && /a[\+\-]?/.test(v)) return 'low';
  return undefined;
};

const formatScore = (value, unit) => {
  if (unit === 'usd') {
    const n = Number(value);
    if (n === 0) return '$0';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k';
    return '$' + n;
  }
  if (unit === 'percent') return `${value}%`;
  if (unit === 'count') return String(value);
  return String(value);
};

// Returns Map<feedId, { feedId, status, sourceUrl, observedAt, coverageReason, claims: [...] }>.
// Each claim carries its own observedAt; the feed-level observedAt is the max across the feed's
// claims. Caller (ttl-to-json) does history dedup using per-claim observedAt.
export function claimsByFeed(store) {
  const byFeed = new Map();
  const ensure = (feedId) => {
    if (!byFeed.has(feedId)) byFeed.set(feedId, {
      feedId, status: null, sourceUrl: null, observedAt: null,
      coverageReason: null, claims: [],
    });
    return byFeed.get(feedId);
  };

  for (const q of store.getQuads(null, P.statedBy, null)) {
    const claim = q.subject.value;
    const feedId = feedUriToId(q.object.value);
    const entry = ensure(feedId);
    const types = objsOf(store, claim, A).map(o => o.value);
    const dim = litVal(objOf(store, claim, P.dimension));
    const label = litVal(objOf(store, claim, LABEL));

    const src = litVal(objOf(store, claim, P.sourceURL));
    if (src && !entry.sourceUrl) entry.sourceUrl = src;
    const obsRaw = litVal(objOf(store, claim, P.observedAt));
    const obs = obsRaw ? obsRaw.slice(0, 10) : null;
    if (obs && (!entry.observedAt || obs > entry.observedAt)) entry.observedAt = obs;

    if (types.includes(T.CoverageStatement)) {
      const raw = litVal(objOf(store, claim, P.coverageStatus));
      const mapped = STATUS_FROM_TTL[raw] || null;
      if (mapped) entry.status = entry.status ? pickBestStatus(entry.status, mapped) : mapped;
      const reason = litVal(objOf(store, claim, P.coverageReason));
      if (reason && !entry.coverageReason) entry.coverageReason = reason;
      continue;
    }
    if (types.includes(T.Rating)) {
      const value = litVal(objOf(store, claim, P.ratingValue));
      const scale = litVal(objOf(store, claim, P.ratingScale));
      entry.claims.push({ dim: dim || label || 'rating', value, scale, level: guessLevel(value, scale), label: label || undefined, observedAt: obs });
      continue;
    }
    if (types.includes(T.Score)) {
      const value = litVal(objOf(store, claim, P.scoreValue));
      const unit  = litVal(objOf(store, claim, P.scoreUnit));
      entry.claims.push({ dim: dim || 'score', value: formatScore(value, unit), scale: unit, level: guessLevel(value, unit), label: label || undefined, observedAt: obs });
      continue;
    }
    if (types.includes(T.Finding)) {
      entry.claims.push({ dim: dim || 'finding', value: label || dim || 'finding', scale: dim, level: undefined, observedAt: obs });
      continue;
    }
  }
  for (const e of byFeed.values()) {
    // Prose-overlay Finding triples (dim="methodology") aren't user-facing claims.
    e.claims = e.claims.filter(c => c.dim !== 'methodology');
  }
  return byFeed;
}

// Split a feed's claims into { current, history } using observedAt.
// current[]: most recent value per dim.
// history[]: { observedAt, claims: [{dim, value, scale, level}] } entries for OLDER snapshots,
//            newest first. Consecutive-identical values per dim are collapsed across snapshots
//            so the timeline shows when values CHANGED.
export function splitCurrentVsHistory(claims) {
  if (!claims.length) return { current: [], history: [] };

  // Group claims by observedAt date (claims without observedAt go into a synthetic "n/a" bucket
  // and are treated as the most-current).
  const byDate = new Map();
  for (const c of claims) {
    const key = c.observedAt || '_';
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(c);
  }

  const dates = Array.from(byDate.keys()).sort().reverse(); // newest first; '_' sorts before dates
  // ensure '_' (no-date) comes first
  dates.sort((a, b) => {
    if (a === '_' && b !== '_') return -1;
    if (b === '_' && a !== '_') return 1;
    return b.localeCompare(a);
  });

  // Build current[]: most-recent value per dim across all snapshots
  const seenDim = new Set();
  const current = [];
  for (const d of dates) {
    for (const c of byDate.get(d)) {
      if (seenDim.has(c.dim)) continue;
      seenDim.add(c.dim);
      const { observedAt, ...rest } = c;
      current.push({ ...rest, observedAt: observedAt || undefined });
    }
  }

  // Build history[]: every snapshot date that has at least one claim NOT already in current
  // OR whose value for the same dim differs from the next-newer snapshot.
  // Simpler: emit a history entry per date (excluding the synthetic "_" no-date bucket),
  // showing the values at that point in time, then dedup consecutive identical values per dim
  // across history entries.
  const history = [];
  const realDates = dates.filter(d => d !== '_').sort().reverse();
  if (realDates.length < 2) return { current, history };

  // For dedup we need to know what each dim's value was at each date.
  // valueAt: Map<date, Map<dim, claim>>
  const valueAt = new Map();
  for (const d of realDates) {
    const m = new Map();
    for (const c of byDate.get(d)) m.set(c.dim, c);
    valueAt.set(d, m);
  }
  // For each date (newest → oldest), emit only the dim values that DIFFER from the next-newer
  // snapshot (i.e. the change). Skip the newest date — those values are already in current[].
  let prev = valueAt.get(realDates[0]);
  for (let i = 1; i < realDates.length; i++) {
    const d = realDates[i];
    const here = valueAt.get(d);
    const changes = [];
    for (const [dim, claim] of here) {
      const prevClaim = prev.get(dim);
      if (!prevClaim || String(prevClaim.value) !== String(claim.value)) {
        const { observedAt, ...rest } = claim;
        changes.push({ ...rest });
      }
    }
    if (changes.length) history.push({ observedAt: d, claims: changes });
    prev = here;
  }
  return { current, history };
}
