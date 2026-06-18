export default function PendingAdapterCard({ feed }) {
  return (
    <div className="feed-card pending" data-type={feed.type}>
      <div className="head">
        <span className="name">{feed.name}</span>
        <span className="type-chip">{feed.type}</span>
        <span className="focus">{feed.focus}</span>
        <span className="spacer"></span>
        <span className="badge pending">adapter pending</span>
      </div>
      <div className="coverage-only">
        <span className="stamp">adapter not yet implemented</span>
        Coverage for this feed will appear once <code>data/adapters/{feed.id}/to-ttl.mjs</code> lands.
        {feed.methodology ? <> Methodology: {feed.methodology}</> : null}
      </div>
    </div>
  );
}
