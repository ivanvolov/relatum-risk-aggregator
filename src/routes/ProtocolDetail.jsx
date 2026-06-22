import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { loadIndex, loadProtocol } from '../lib/data.js';
import { fmtUsd } from '../lib/format.js';
import FeedCard from '../components/FeedCard.jsx';
import PendingAdapterCard from '../components/PendingAdapterCard.jsx';
import HistorySection from '../components/HistorySection.jsx';
import Sidecard from '../components/Sidecard.jsx';
import Avatar from '../components/Avatar.jsx';
import ChainStrip from '../components/ChainStrip.jsx';

export default function ProtocolDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const focusFeed = searchParams.get('feed');
  const [index, setIndex] = useState(null);
  const [detail, setDetail] = useState(undefined); // undefined = loading, null = not found
  const [openFeeds, setOpenFeeds] = useState(null); // Set of expanded feedIds; null = use defaults

  useEffect(() => {
    let cancel = false;
    // If we arrived from a cell click, seed the open set with that feed so it's
    // expanded when the page renders. Otherwise null → first-covered default.
    setOpenFeeds(focusFeed ? new Set([focusFeed]) : null);
    Promise.all([loadIndex(), loadProtocol(slug)]).then(([i, d]) => {
      if (cancel) return;
      setIndex(i);
      setDetail(d);
    });
    return () => { cancel = true; };
  }, [slug, focusFeed]);

  useEffect(() => {
    if (!detail || !focusFeed) return;
    const id = `feed-${focusFeed}`;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [detail, focusFeed]);

  if (!index || detail === undefined) return <main className="page"><p>Loading…</p></main>;
  if (!detail) {
    return (
      <main className="page">
        <div className="mblock">
          <h2>Protocol not found</h2>
          <p>Unknown slug "<code>{slug}</code>".</p>
          <p><Link to="/">← Back to all protocols</Link></p>
        </div>
      </main>
    );
  }

  const D = detail;
  // Pending-adapter feeds are hidden from the public UI entirely — neither column
  // on the matrix nor card here. They remain in the methodology page registry so a
  // reviewer can confirm we acknowledged them. Re-enabling = re-register the
  // normalizer in data/build/feeds-to-json.mjs.
  const visibleFeeds = D.feeds.filter(f => f.adapterStatus !== 'pending');
  const coveredFeeds = visibleFeeds.filter(f => f.status === 'cov' || f.status === 'part');

  // Sort: covered first (alphabetical within), then partial, then not-covered.
  const sortRank = (e) => {
    if (e.status === 'cov') return 0;
    if (e.status === 'part') return 1;
    return 2;
  };
  const sortedFeeds = [...visibleFeeds].sort((a, b) => {
    const ra = sortRank(a), rb = sortRank(b);
    if (ra !== rb) return ra - rb;
    return a.feedId.localeCompare(b.feedId);
  });

  // First covered feed is open by default. Multiple cards can be open at once —
  // once the user clicks anything, openFeeds is a Set they fully control.
  const firstCovered = sortedFeeds.find(e => e.status === 'cov' || e.status === 'part');
  const defaults = firstCovered ? new Set([firstCovered.feedId]) : new Set();
  const activeOpen = openFeeds ?? defaults;
  const isOpen = (feedId) => activeOpen.has(feedId);
  const toggleOpen = (feedId) => setOpenFeeds(prev => {
    const next = new Set(prev ?? defaults);
    if (next.has(feedId)) next.delete(feedId);
    else next.add(feedId);
    return next;
  });

  return (
    <main className="page" id="detail">
      <div className="detail-header">
        <Avatar name={D.name} logoUrl={D.logoUrl} size="lg" />
        <div className="header-text">
          <div className="breadcrumbs"><Link to="/">All protocols</Link> &nbsp;/&nbsp; {D.category} &nbsp;/&nbsp; {D.name}</div>
          <h1>{D.name}</h1>
        </div>
        <div className="header-tvl">
          <div className="lbl">TVL</div>
          <div className="val">{D.tvl_usd ? fmtUsd(D.tvl_usd) : '—'}</div>
        </div>
      </div>
      {D.description ? <p className="lede">{D.description}</p> : null}
      {D.lastUpdated ? <div className="updated-stamp">Data last updated: {D.lastUpdated}</div> : null}

      <div className="detail-grid">
        <div>
          {D.sidecards.length ? D.sidecards.map((sc, i) => (
            <Sidecard key={i} sc={sc} degradeNote={D.governance_degrade_note} />
          )) : (
            <div className="sidecard">
              <h3>Overview</h3>
              {[
                { k: 'Category', v: D.category },
                { k: 'Family', v: D.family },
                { k: 'TVL', v: D.tvl_usd ? fmtUsd(D.tvl_usd) : null },
                { k: 'Volume (24h)', v: D.volume_usd_24h ? fmtUsd(D.volume_usd_24h) : null },
                { k: 'Audits', v: D.audit_count != null ? `${D.audit_count}${D.audit_history?.length ? ` (${D.audit_history.length} on file)` : ''}` : null },
                { k: 'Governance', v: D.governance_summary },
                { k: 'Last updated', v: D.lastUpdated },
              ].map((r, i) => (
                <div key={i} className="kv">
                  <span className="k">{r.k}</span>
                  <span className={'v' + (r.v ? '' : ' dim')}>{r.v || '—'}</span>
                </div>
              ))}
              {D.chains && D.chains.length ? (
                <div className="kv">
                  <span className="k">Chains</span>
                  <span className="v"><ChainStrip chains={D.chains} /></span>
                </div>
              ) : null}
            </div>
          )}
          {(D.homepage || D.twitter || (D.github && D.github.length) || D.parent_protocol) ? (
            <div className="sidecard">
              <h3>Links</h3>
              {D.homepage ? (
                <div className="kv"><span className="k">Website</span>
                  <span className="v"><a href={D.homepage} target="_blank" rel="noreferrer">{D.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></span>
                </div>
              ) : null}
              {D.twitter ? (
                <div className="kv"><span className="k">Twitter</span>
                  <span className="v"><a href={`https://twitter.com/${D.twitter}`} target="_blank" rel="noreferrer">@{D.twitter}</a></span>
                </div>
              ) : null}
              {D.github && D.github.length ? (
                <div className="kv"><span className="k">GitHub</span>
                  <span className="v">
                    {D.github.map((g, i) => {
                      const url = g.startsWith('http') ? g : `https://github.com/${g}`;
                      const label = g.startsWith('http') ? g.replace(/^https?:\/\/github\.com\//, '') : g;
                      return <span key={i}>{i > 0 ? ', ' : ''}<a href={url} target="_blank" rel="noreferrer">{label}</a></span>;
                    })}
                  </span>
                </div>
              ) : null}
              {D.parent_protocol ? (
                <div className="kv"><span className="k">Parent</span>
                  <span className="v">{D.parent_protocol.replace(/^parent#/, '')}</span>
                </div>
              ) : null}
              {D.methodology_url ? (
                <div className="kv"><span className="k">Methodology</span>
                  <span className="v"><a href={D.methodology_url} target="_blank" rel="noreferrer">View →</a></span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <div className="feeds-section-head">
            <h2>Risk Intelligence Feeds</h2>
            <span className="feed-counter"><strong>{coveredFeeds.length}</strong> risk feeds available</span>
          </div>
          <div className="feed-accordion">
            {sortedFeeds.map(entry => {
              const meta = index.feedById(entry.feedId);
              if (!meta) return null;
              return (
                <FeedCard
                  key={entry.feedId}
                  feedMeta={meta}
                  entry={entry}
                  isOpen={isOpen(entry.feedId)}
                  onToggle={() => toggleOpen(entry.feedId)}
                />
              );
            })}
          </div>

        </div>
      </div>

      {D.audit_history && D.audit_history.length ? (
        <section className="full-block audit-block">
          <h2>Audit History <span className="prov self">self-reported</span></h2>
          <table className="audit-table">
            <thead><tr><th>Firm / Source</th><th>Date</th><th>Report</th></tr></thead>
            <tbody>
              {D.audit_history.map((a, i) => (
                <tr key={i}>
                  <td className={'firm' + (a.firm ? '' : ' dim')}>{a.firm || '—'}</td>
                  <td className={'date' + (a.date ? '' : ' dim')}>{a.date || '—'}</td>
                  <td className="report">{a.report_url ? <a href={a.report_url} target="_blank" rel="noreferrer">{a.report_url.replace(/^https?:\/\//, '').slice(0, 60)}{a.report_url.length > 60 ? '…' : ''} →</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="full-block incident-block">
        <h2>Incident History <span className="prov curated">curated</span></h2>
        {D.incidents && D.incidents.length ? (
          <table className="incident-table">
            <thead><tr><th>Date</th><th>Severity</th><th>Description</th><th>Loss (USD)</th></tr></thead>
            <tbody>
              {D.incidents.map((i, k) => (
                <tr key={k}>
                  <td>{i.date}</td>
                  <td>{i.severity}</td>
                  <td>{i.description}</td>
                  <td className="amount">{i.loss_usd ? fmtUsd(i.loss_usd) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No known incidents on record.</div>
        )}
      </section>

      <HistorySection detail={D} feedsMeta={index.feeds} />

      <div className="correct-cta">
        See something wrong? This data is open source.{' '}
        <a href="https://github.com/ivanvolov/relatum-risk-aggregator/issues/new" target="_blank" rel="noreferrer">Submit a correction on GitHub →</a>
      </div>
    </main>
  );
}
