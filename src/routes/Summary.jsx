import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadIndex } from '../lib/data.js';
import { fmtUsd } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';

// Render "N/M green" inlines as a pie split into M equal wedges, with N filled green.
// Center label shows "N/M" so the count is legible at the matrix cell's size.
function PieGrade({ on, total }) {
  const r = 11;
  const cx = 13, cy = 13;
  const wedge = (i) => {
    const a0 = (i * 360 / total - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 360 / total - 90) * Math.PI / 180;
    const sx = cx + r * Math.cos(a0), sy = cy + r * Math.sin(a0);
    const ex = cx + r * Math.cos(a1), ey = cy + r * Math.sin(a1);
    const large = (360 / total) > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${sx.toFixed(3)} ${sy.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(3)} ${ey.toFixed(3)} Z`;
  };
  return (
    <span className="pie-grade" title={`${on}/${total} green grades`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-label={`${on} of ${total} principles graded green`}>
        {Array.from({ length: total }).map((_, i) => (
          <path
            key={i}
            d={wedge(i)}
            fill={i < on ? 'var(--ok)' : 'var(--bg-soft-2)'}
            stroke="var(--bg-elev)"
            strokeWidth="0.8"
          />
        ))}
      </svg>
      <span className="pie-label">{on}/{total}</span>
    </span>
  );
}

// Cell states. The RFP M1 triad is covered / partial / not yet covered; we surface them
// as colored inline rating, green check, orange dot, or em-dash. Adapter-pending feeds
// collapse to the same em-dash on the landing — distinction is only meaningful internally,
// and reviewers on the landing care about "is there a feed signal here" not "did we wire
// the adapter yet". The detail page still distinguishes via PendingAdapterCard.
function MatrixCell({ status, adapterStatus, inline }) {
  const isPending = adapterStatus === 'pending';
  if (!isPending && inline && (status === 'cov' || status === 'part')) {
    const grade = /^(\d+)\/(\d+) green$/.exec(inline);
    if (grade) {
      return <PieGrade on={Number(grade[1])} total={Number(grade[2])} />;
    }
    const cls = inline.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return <span className={`inline-rating ${cls}`} title={inline}>{inline}</span>;
  }
  if (!isPending && status === 'cov') {
    return <span className="cell-check" title="Covered — feed published a record but no specific rating value">✓</span>;
  }
  if (!isPending && status === 'part') {
    return <span className="dot-cell part" title="Partial coverage — see protocol page" />;
  }
  return <span className="cell-dash" title="Not covered">—</span>;
}

export default function Summary() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [sortKey, setSortKey] = useState('tvl_usd');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { loadIndex().then(setData); }, []);

  // Pending-adapter feeds are hidden from the public matrix entirely (no column,
  // no row contribution). They remain listed on the methodology page registry so
  // a reviewer can still see we considered them. The moment a feed's normalizer is
  // re-registered in feeds-to-json.mjs, adapterStatus flips to 'implemented' and
  // it reappears here automatically.
  const visibleFeeds = useMemo(
    () => data ? data.feeds.filter(f => f.adapterStatus !== 'pending') : [],
    [data]
  );

  const categories = useMemo(
    () => data ? Array.from(new Set(data.protocols.map(p => p.category))).sort() : [],
    [data]
  );

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    let r = data.protocols.filter(p => {
      if (cat && p.category !== cat) return false;
      if (!q) return true;
      return (p.name + ' ' + (p.family || '') + ' ' + p.category).toLowerCase().includes(q);
    });
    r = r.map(p => {
      const cov = data.coverage[p.slug] || {};
      const covSum = visibleFeeds.reduce(
        (acc, f) => acc + (cov[f.id]?.status === 'cov' ? 1 : cov[f.id]?.status === 'part' ? 0.5 : 0),
        0
      );
      const coveredFeeds = visibleFeeds.reduce(
        (acc, f) => acc + (cov[f.id]?.status === 'cov' || cov[f.id]?.status === 'part' ? 1 : 0),
        0
      );
      return { ...p, _cov: cov, _covSum: covSum, _coveredFeeds: coveredFeeds };
    });
    const mul = sortDir === 'asc' ? 1 : -1;
    r.sort((a, b) => {
      const av = sortKey === 'name'     ? a.name.toLowerCase()
              : sortKey === 'category' ? a.category
              : sortKey === 'coverage' ? a._covSum
              : a[sortKey] ?? 0;
      const bv = sortKey === 'name'     ? b.name.toLowerCase()
              : sortKey === 'category' ? b.category
              : sortKey === 'coverage' ? b._covSum
              : b[sortKey] ?? 0;
      return av < bv ? -mul : av > bv ? mul : 0;
    });
    return r;
  }, [data, search, cat, sortKey, sortDir, visibleFeeds]);

  const stats = useMemo(() => {
    if (!data) return { cov: 0, part: 0, none: 0, total: 0 };
    let cov = 0, part = 0, none = 0;
    for (const p of data.protocols) {
      const row = data.coverage[p.slug] || {};
      for (const f of visibleFeeds) {
        const s = row[f.id]?.status;
        if (s === 'cov') cov++;
        else if (s === 'part') part++;
        else none++;
      }
    }
    return { cov, part, none, total: data.protocols.length * visibleFeeds.length };
  }, [data, visibleFeeds]);

  if (!data) return <main className="page"><p>Loading…</p></main>;

  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const Sortable = ({ k, children, title }) => (
    <th data-key={k} className="sortable" onClick={() => onSort(k)} title={title}>{children}</th>
  );

  return (
    <main className="page">
      <h1>Risk feed coverage for the top Ethereum DeFi protocols</h1>

      <div id="matrixStats" className="stat-strip">
        <div className="stat"><div className="k">Protocols</div><div className="v">{data.protocols.length}</div></div>
        <div className="stat"><div className="k">Feeds</div><div className="v">{visibleFeeds.length}</div></div>
        <div className="stat"><div className="k">Matrix cells</div><div className="v">{stats.total}</div></div>
        <div className="stat"><div className="k">Covered</div><div className="v" style={{color:'var(--ok)'}}>{stats.cov}</div></div>
        <div className="stat"><div className="k">Partial</div><div className="v" style={{color:'var(--partial)'}}>{stats.part}</div></div>
        <div className="stat"><div className="k">Not covered</div><div className="v" style={{color:'var(--no)'}}>{stats.none}</div></div>
      </div>

      <div className="controls">
        <input type="search" placeholder="Search protocols…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="cat-chips">
          <button className={'cat-chip' + (cat === '' ? ' active' : '')} onClick={() => setCat('')}>All</button>
          {categories.map(c => (
            <button key={c} className={'cat-chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <Sortable k="name">Protocol</Sortable>
              <Sortable k="category">Category</Sortable>
              <Sortable k="tvl_usd">ETH TVL</Sortable>
              <th className="gov-col" title="Multisig threshold · timelock (from Safe API when available)">Gov</th>
              <th data-key="coverage" className="sortable feeds-col-edge" onClick={() => onSort('coverage')} title="Number of feeds covering (full or partial)">Feeds</th>
              {visibleFeeds.map(f => (
                <th key={f.id} className="feed" title={`${f.name} — ${f.focus}`}>{f.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              // Every row is rendered the same way. The `versions` field on the registry
              // is informational metadata only — there is no per-version coverage data in
              // the JSON, so there's no disclosure to open. The "(N versions)" suffix is
              // kept inline because it tells the reader the row covers a family of releases.
              const versionsNote = p.versions ? ` (covers ${p.versions.join(' · ')})` : '';
              return (
                <tr key={p.slug}>
                  <td className="proto">
                    <Link to={`/protocol/${p.slug}`} title={p.family ? `${p.name}${versionsNote}` : p.name}>
                      <Avatar name={p.name} logoUrl={p.logoUrl} size="sm" />
                      <span>
                        {p.name}
                        <span className="meta">{p.family}{p.versions ? ` · ${p.versions.length} versions` : ''}</span>
                      </span>
                    </Link>
                  </td>
                  <td><span className="badge dim">{p.category}</span></td>
                  <td className="tvl">{p.tvl_usd ? fmtUsd(p.tvl_usd) : (p.volume_usd_24h ? fmtUsd(p.volume_usd_24h) + '/d' : '—')}</td>
                  <td className="gov-cell">{p.governance_summary || '—'}</td>
                  <td className="tvl feeds-col-edge">{p._coveredFeeds} feeds</td>
                  {visibleFeeds.map(f => {
                    const cell = p._cov[f.id] || { status: 'none', adapterStatus: 'pending', inline: null };
                    return (
                      <td key={f.id} className="cell">
                        <MatrixCell status={cell.status} adapterStatus={cell.adapterStatus} inline={cell.inline} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="legend">
        <span className="item"><span className="inline-rating stage-2">Stage 2</span>verbatim rating — what the feed published, shown as-is</span>
        <span className="item"><span className="cell-check">✓</span>covered, no rating — feed has a record but didn't publish a value</span>
        <span className="item"><span className="dot-cell part"></span>partial — covers a related entity (e.g. Pharos on Aave via GHO)</span>
        <span className="item"><span className="cell-dash">—</span>not covered — feed has no published record (hover for reason)</span>
      </div>

      <footer className="page-footer">
        Built from the rfp: vocabulary at data/ontology/vocab.ttl ·
        Every claim in the graph carries rfp:statedBy + rfp:sourceURL + rfp:observedAt
      </footer>
    </main>
  );
}
