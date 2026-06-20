function badge(status) {
  if (status === 'cov')  return <span className="badge cov">covered</span>;
  if (status === 'part') return <span className="badge part">partial</span>;
  if (status === 'none') return <span className="badge none">not covered</span>;
  return <span className="badge dim">—</span>;
}

// Small icon button that opens the source URL in a new tab. Click is stop-propagated
// so the parent header doesn't also toggle the accordion.
function SourceButton({ url }) {
  if (!url) return null;
  const onClick = (e) => e.stopPropagation();
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="source-btn"
      onClick={onClick}
      title="Open source page"
      aria-label="Open source page in new tab"
    >↗</a>
  );
}

// Accordion-style feed card. `isOpen` and `onToggle` drive expansion; covered (or
// partial) cards are expandable, not-yet-covered cards are static one-liners.
export default function FeedCard({ feedMeta, entry, isOpen, onToggle }) {
  const { status } = entry;
  const isCovered = status === 'cov' || status === 'part';

  // Not-yet-covered cards: compact one-liner, no expand affordance.
  if (!isCovered) {
    return (
      <div className="feed-card not-covered" data-type={feedMeta.type} id={`feed-${entry.feedId}`}>
        <div className="head static" aria-disabled="true">
          <span className="name">{feedMeta.name}</span>
          <span className="type-chip">{feedMeta.type}</span>
          <span className="focus">{feedMeta.focus}</span>
          <span className="spacer"></span>
          {badge(status)}
        </div>
        <div className="not-covered-line">
          {entry.coverageReason || `Not in ${feedMeta.name}'s covered set.`}
        </div>
      </div>
    );
  }

  return (
    <div className={'feed-card' + (isOpen ? ' open' : '')} data-type={feedMeta.type} id={`feed-${entry.feedId}`}>
      <button type="button" className="head expandable" onClick={onToggle} aria-expanded={isOpen}>
        <span className="name">{feedMeta.name}</span>
        <span className="type-chip">{feedMeta.type}</span>
        <span className="focus">{feedMeta.focus}</span>
        <span className="spacer"></span>
        {badge(status)}
        <SourceButton url={entry.sourceUrl} />
        <span className="chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen ? (
        entry.claims && entry.claims.length ? (
          <div className="body">
            {entry.methodology ? <div className="methodology">{entry.methodology}</div> : null}
            <div className="claims">
              {entry.claims.map((c, i) => (
                <div key={i} className={'claim ' + (c.level || '')}>
                  <div className="dim">{c.dim}</div>
                  <div className="val">
                    {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.value}</a> : c.value}
                  </div>
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
      ) : null}
    </div>
  );
}
