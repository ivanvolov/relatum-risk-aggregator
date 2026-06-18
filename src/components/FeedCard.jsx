function badge(status) {
  if (status === 'cov')  return <span className="badge cov">covered</span>;
  if (status === 'part') return <span className="badge part">partial</span>;
  if (status === 'none') return <span className="badge none">not yet</span>;
  return <span className="badge dim">—</span>;
}

const cleanUrl = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

export default function FeedCard({ feedMeta, entry }) {
  const { status } = entry;
  const isCovered = status === 'cov' || status === 'part';

  return (
    <div className="feed-card" data-type={feedMeta.type}>
      <div className="head">
        <span className="name">{feedMeta.name}</span>
        <span className="type-chip">{feedMeta.type}</span>
        <span className="focus">{feedMeta.focus}</span>
        <span className="spacer"></span>
        {badge(status)}
        {entry.sourceUrl ? <> &nbsp; <a className="source" href={entry.sourceUrl} target="_blank" rel="noreferrer">{cleanUrl(entry.sourceUrl)}</a></> : null}
      </div>

      {isCovered ? (
        entry.claims && entry.claims.length ? (
          <div className="body">
            {entry.methodology ? <div className="methodology">{entry.methodology}</div> : null}
            <div className="claims">
              {entry.claims.map((c, i) => (
                <div key={i} className={'claim ' + (c.level || '')}>
                  <div className="dim">{c.dim}</div>
                  <div className="val">{c.value}</div>
                  <div className="scale">{c.scale || ''}</div>
                </div>
              ))}
            </div>
            {entry.notable ? (
              <div className="notable">
                <div className="lbl">{entry.notable.label}</div>
                <div className="text">{entry.notable.text}</div>
              </div>
            ) : null}
            {entry.findings ? (
              <div className="notable findings">
                <div className="lbl">{entry.findings.label}</div>
                <div className="text">{entry.findings.text}</div>
              </div>
            ) : null}
            {(entry.sourceUrl || entry.observedAt) ? (
              <div className="observe-date">
                {entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">View assessment →</a> : null}
                {' '}<span className="prov feed">[feed]</span>
                {entry.observedAt ? <> <span className="date">{entry.observedAt}</span></> : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="body">
            {entry.methodology ? <div className="methodology">{entry.methodology}</div> : null}
            {entry.coverageReason ? (
              <div className="notable">
                <div className="lbl">Coverage</div>
                <div className="text">{entry.coverageReason}</div>
              </div>
            ) : null}
            {entry.notable ? (
              <div className="notable">
                <div className="lbl">{entry.notable.label}</div>
                <div className="text">{entry.notable.text}</div>
              </div>
            ) : null}
            {(entry.sourceUrl || entry.observedAt) ? (
              <div className="observe-date">
                {entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">View assessment →</a> : null}
                {' '}<span className="prov feed">[feed]</span>
                {entry.observedAt ? <> <span className="date">{entry.observedAt}</span></> : null}
              </div>
            ) : null}
          </div>
        )
      ) : (
        <div className="coverage-only">
          <span className="stamp">not yet covered</span>
          {entry.coverageReason || `Not in ${feedMeta.name}'s covered set.`}
        </div>
      )}
    </div>
  );
}
