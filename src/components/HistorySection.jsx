// Renders the per-protocol change timeline: for each feed that has history entries,
// shows when claim values changed and what the new value was.
export default function HistorySection({ detail, feedsMeta }) {
  const feedsWithHistory = detail.feeds.filter(f => f.history && f.history.length > 0);
  if (!feedsWithHistory.length) return null;

  const feedById = id => feedsMeta.find(f => f.id === id);

  return (
    <section className="full-block history-block">
      <h2>History <span className="prov feed">[feed]</span></h2>
      <p className="rdf-example-cap">
        Past claims, dedup'd to show changes only. Every entry is a `rfp:observedAt` timestamp on a claim in the graph.
      </p>
      {feedsWithHistory.map(f => {
        const meta = feedById(f.feedId);
        return (
          <div key={f.feedId} className="history-feed">
            <h3>{meta?.name || f.feedId}</h3>
            <table className="history-table">
              <thead>
                <tr><th>Date</th><th>Dimension</th><th>Value</th><th>Scale</th></tr>
              </thead>
              <tbody>
                {f.history.flatMap(snap =>
                  snap.claims.map((c, i) => (
                    <tr key={snap.observedAt + '-' + i}>
                      <td className="date">{snap.observedAt}</td>
                      <td>{c.dim}</td>
                      <td>{c.value}</td>
                      <td className="scale">{c.scale || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}
