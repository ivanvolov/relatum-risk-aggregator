import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadIndex } from '../lib/data.js';
import { fmtUsd, initials } from '../lib/format.js';

// Three-state cell:
//   adapterStatus=pending          → grey hatched dot, tooltip "adapter pending"
//   adapterStatus=implemented, cov → green dot (or inline rating snippet)
//   adapterStatus=implemented, part/none → orange/red dot
function MatrixCell({ status, adapterStatus, inline }) {
  if (adapterStatus === 'pending' && status === 'none') {
    return <span className="dot-cell pending" title="Adapter not yet implemented" />;
  }
  if (inline && (status === 'cov' || status === 'part')) {
    const cls = inline.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return <span className={`inline-rating ${cls}`}>{inline}</span>;
  }
  const cls = status === 'cov' ? 'cov' : status === 'part' ? 'part' : 'none';
  const title = status === 'cov' ? 'Covered' : status === 'part' ? 'Partial coverage — see protocol page' : 'Not yet covered';
  return <span className={`dot-cell ${cls}`} title={title} />;
}

export default function Summary() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [sortKey, setSortKey] = useState('tvl_usd');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { loadIndex().then(setData); }, []);

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
      const covSum = data.feeds.reduce(
        (acc, f) => acc + (cov[f.id]?.status === 'cov' ? 1 : cov[f.id]?.status === 'part' ? 0.5 : 0),
        0
      );
      const coveredFeeds = data.feeds.reduce(
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
  }, [data, search, cat, sortKey, sortDir]);

  const stats = useMemo(() => {
    if (!data) return { cov: 0, part: 0, none: 0, total: 0 };
    let cov = 0, part = 0, none = 0;
    for (const p of data.protocols) {
      const row = data.coverage[p.slug] || {};
      for (const f of data.feeds) {
        const s = row[f.id]?.status;
        if (s === 'cov') cov++;
        else if (s === 'part') part++;
        else none++;
      }
    }
    return { cov, part, none, total: data.protocols.length * data.feeds.length };
  }, [data]);

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
      <p className="lede">
        Every cell shows what one risk feed says about one protocol — verbatim, with provenance.
        There is no composite score, no ranking, no synthesis. Coverage gaps are shown explicitly.
        Click a protocol name for the per-feed detail.
      </p>

      <div id="matrixStats" className="stat-strip">
        <div className="stat"><div className="k">Protocols</div><div className="v">{data.protocols.length}</div></div>
        <div className="stat"><div className="k">Feeds</div><div className="v">{data.feeds.length}</div></div>
        <div className="stat"><div className="k">Matrix cells</div><div className="v">{stats.total}</div></div>
        <div className="stat"><div className="k">Covered</div><div className="v" style={{color:'var(--ok)'}}>{stats.cov}</div></div>
        <div className="stat"><div className="k">Partial</div><div className="v" style={{color:'var(--partial)'}}>{stats.part}</div></div>
        <div className="stat"><div className="k">Not yet</div><div className="v" style={{color:'var(--no)'}}>{stats.none}</div></div>
      </div>

      <div className="controls">
        <input type="search" placeholder="Search protocols…" value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{marginLeft:'auto',fontSize:11,color:'var(--ink-faint)'}} className="mono">
          click column headers to sort · hover dots for status
        </span>
      </div>
      <div className="cat-chips" style={{marginBottom:16}}>
        <button className={'cat-chip' + (cat === '' ? ' active' : '')} onClick={() => setCat('')}>All</button>
        {categories.map(c => (
          <button key={c} className={'cat-chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <Sortable k="name">Protocol</Sortable>
              <Sortable k="category">Category</Sortable>
              <Sortable k="tvl_usd">ETH TVL</Sortable>
              <th className="gov-col" title="Multisig threshold · timelock (from Safe API when available)">Gov</th>
              <Sortable k="coverage" title="Number of feeds covering (full or partial)">Feeds</Sortable>
              {data.feeds.map(f => (
                <th key={f.id} className="feed" title={`${f.name} — ${f.focus}`}>{f.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const isFamily = !!p.versions;
              return (
                <tr key={p.slug} className={isFamily ? 'family-row' : undefined}>
                  <td className="proto">
                    <Link to={`/protocol/${p.slug}`}>
                      {isFamily
                        ? <><span className="arrow">▶</span><span>{p.name}<span className="version-count">({p.versions.length} versions)</span></span></>
                        : <><span className="avatar">{initials(p.name)}</span><span>{p.name}<span className="meta">{p.family}</span></span></>}
                    </Link>
                  </td>
                  <td><span className="badge dim">{p.category}</span></td>
                  <td className="tvl">{p.tvl_usd ? fmtUsd(p.tvl_usd) : (p.volume_usd_24h ? fmtUsd(p.volume_usd_24h) + '/d' : '—')}</td>
                  <td className="gov-cell">{p.governance_summary || '—'}</td>
                  <td className="tvl">{p._coveredFeeds} feeds</td>
                  {data.feeds.map(f => {
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
        <span className="item"><span className="dot-cell cov"></span>covered — feed publishes data, mapped via adapter</span>
        <span className="item"><span className="dot-cell part"></span>partial — covers a related entity (e.g. Pharos on Aave via GHO)</span>
        <span className="item"><span className="dot-cell none"></span>not yet covered — explicit absence, not a missing cell</span>
        <span className="item"><span className="dot-cell pending"></span>adapter pending — TTL mapper not yet built</span>
      </div>

      <footer className="page-footer">
        Built from the rfp: vocabulary at data/ontology/vocab.ttl ·
        Every claim in the graph carries rfp:statedBy + rfp:sourceURL + rfp:observedAt
      </footer>
    </main>
  );
}
