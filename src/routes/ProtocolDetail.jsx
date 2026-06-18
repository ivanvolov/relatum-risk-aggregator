import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadIndex, loadProtocol } from '../lib/data.js';
import { fmtUsd, initials } from '../lib/format.js';
import FeedCard from '../components/FeedCard.jsx';
import PendingAdapterCard from '../components/PendingAdapterCard.jsx';
import HistorySection from '../components/HistorySection.jsx';
import Sidecard from '../components/Sidecard.jsx';

export default function ProtocolDetail() {
  const { slug } = useParams();
  const [index, setIndex] = useState(null);
  const [detail, setDetail] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let cancel = false;
    Promise.all([loadIndex(), loadProtocol(slug)]).then(([i, d]) => {
      if (cancel) return;
      setIndex(i);
      setDetail(d);
    });
    return () => { cancel = true; };
  }, [slug]);

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
  const coveredFeeds = D.feeds.filter(f => f.status === 'cov' || f.status === 'part');
  const pendingFeeds = D.feeds.filter(f => f.adapterStatus === 'pending');
  const notYet = D.feeds.filter(f => f.status === 'none' && f.adapterStatus === 'implemented')
    .map(f => index.feedById(f.feedId))
    .filter(Boolean);

  return (
    <main className="page" id="detail">
      <div className="detail-header">
        <div className="avatar-lg">{initials(D.name)}</div>
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
          )) : <div className="sidecard"><h3>Identity</h3><div className="kv"><span className="k">Slug</span><span className="v">{D.slug}</span></div></div>}
        </div>

        <div>
          <div className="feeds-section-head">
            <h2>Risk Intelligence Feeds</h2>
            <span className="feed-counter"><strong>{coveredFeeds.length}</strong> risk feeds available</span>
          </div>
          <p className="feeds-section-sub">
            Each card is one provider's view of this protocol. Methodology shown before findings.
            Ratings shown verbatim where they exist. {pendingFeeds.length ? `${pendingFeeds.length} adapter(s) pending — those cards mark themselves as such.` : null}
          </p>
          <div className="feed-grid">
            {D.feeds.map(entry => {
              const meta = index.feedById(entry.feedId);
              if (!meta) return null;
              if (entry.adapterStatus === 'pending' && entry.status === 'none') {
                return <PendingAdapterCard key={entry.feedId} feed={meta} />;
              }
              return <FeedCard key={entry.feedId} feedMeta={meta} entry={entry} />;
            })}
          </div>

          {notYet.length ? (
            <div className="not-yet-covered">
              <span className="lbl">Not yet covered by:</span>{' '}
              {notYet.map((f, i) => (
                <span key={f.id}>
                  {i > 0 ? ', ' : ''}<span className="feed-name">{f.name}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {D.audit_history && D.audit_history.length ? (
        <section className="full-block audit-block">
          <h2>Audit History <span className="prov self">self-reported</span></h2>
          <table className="audit-table">
            <thead><tr><th>Firm</th><th>Date</th><th>Report</th></tr></thead>
            <tbody>
              {D.audit_history.map((a, i) => (
                <tr key={i}>
                  <td className="firm">{a.firm}</td>
                  <td className="date">{a.date}</td>
                  <td className="report">{a.report_url ? <a href={a.report_url} target="_blank" rel="noreferrer">View →</a> : '—'}</td>
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
