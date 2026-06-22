import ChainStrip, { resolveChainName } from './ChainStrip.jsx';

// Claim dims that carry a comma-separated list of chains (names or numeric IDs).
// When matched, FeedCard renders the value as a ChainStrip instead of plain text.
const CHAIN_LIST_DIMS = new Set(['networks', 'chains']);

function maybeChainList(claim) {
  if (!CHAIN_LIST_DIMS.has(claim.dim)) return null;
  const tokens = String(claim.value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(resolveChainName)
    .filter(Boolean);
  return tokens.length ? tokens : null;
}

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
    const v = entry.verified;
    const verifiedLine = v
      ? `✓ Verified absent ${v.date}${v.by ? ' by ' + v.by : ''}${v.note ? ' — ' + v.note : ''}`
      : null;
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
        {verifiedLine ? <div className="not-covered-line" style={{opacity: 0.7, fontSize: '0.85em'}}>{verifiedLine}</div> : null}
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
            {entry.partialNote ? (
              <div className="notable">
                <div className="lbl">Partial coverage</div>
                <div className="text">{entry.partialNote}</div>
              </div>
            ) : null}
            <div className="claims">
              {entry.claims.map((c, i) => {
                const chainList = maybeChainList(c);
                return (
                  <div key={i} className={'claim ' + (c.level || '')}>
                    <div className="dim">{c.dim}</div>
                    <div className="val">
                      {chainList ? (
                        <ChainStrip chains={chainList} max={20} />
                      ) : c.url ? (
                        <a href={c.url} target="_blank" rel="noreferrer">{c.value}</a>
                      ) : c.value}
                    </div>
                    <div className="scale">{c.scale || ''}</div>
                  </div>
                );
              })}
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
            {entry.observedAt ? (
              <div className="observe-date">
                <span className="date">{entry.observedAt}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="body">
            {entry.methodology ? <div className="methodology">{entry.methodology}</div> : null}
            {entry.partialNote ? (
              <div className="notable">
                <div className="lbl">Partial coverage</div>
                <div className="text">{entry.partialNote}</div>
              </div>
            ) : entry.coverageReason ? (
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
            {entry.observedAt ? (
              <div className="observe-date">
                <span className="date">{entry.observedAt}</span>
              </div>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
