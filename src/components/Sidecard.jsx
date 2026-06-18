export default function Sidecard({ sc, degradeNote }) {
  return (
    <div className="sidecard">
      <h3>
        {sc.title}
        {sc.prov ? <span className={`prov ${sc.prov}`}>{sc.prov}</span> : null}
      </h3>
      {sc.rows.map((r, i) => (
        <div key={i} className="kv">
          <span className="k">{r.k}</span>
          <span className="v">{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.v}</a> : r.v}</span>
        </div>
      ))}
      {sc.title === 'Governance' && degradeNote ? (
        <div className="degrade-notice">
          <span className="lbl">Source →</span> {degradeNote}.{' '}
          <a href="https://github.com/ivanvolov/relatum-risk-aggregator/issues/new" target="_blank" rel="noreferrer" className="cta-link">Flag inaccuracies via GitHub</a>
        </div>
      ) : null}
    </div>
  );
}
