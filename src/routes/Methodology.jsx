import { useEffect, useState } from 'react';
import { loadIndex } from '../lib/data.js';

export default function Methodology() {
  const [data, setData] = useState(null);
  useEffect(() => { loadIndex().then(setData); }, []);

  return (
    <main className="page">
      <h1>Methodology</h1>
      <p className="lede">
        Relatum aggregates what every major DeFi risk feed says about a protocol, side by side,
        without synthesis. The data substrate is an RDF knowledge graph; every UI cell traces back
        to a single feed and a single source URL, with provenance preserved at the triple level.
      </p>

      <div className="mblock oracle-analogy">
        <h2>The Oracle Analogy</h2>
        <p>No single price feed is canonical. A well-designed oracle aggregates many feeds to produce one trusted value, with no individual source treated as authoritative. <strong>The aggregation is the value.</strong></p>
        <p>The same principle applies to DeFi risk. <strong>Relatum is the aggregation layer that doesn't exist yet</strong> — a neutral place to see what every risk feed says about a protocol, side by side, with sources intact.</p>
      </div>

      <div className="does-grid">
        <div className="does-card does-not">
          <div className="hd"><span className="mark-x">✕</span><h2>What Relatum does <em>not</em> do</h2></div>
          <ul>
            <li>Relatum does not assign its own risk scores.</li>
            <li>Relatum does not weight or rank risk feeds against each other.</li>
            <li>Relatum does not tell you whether a protocol is safe or unsafe.</li>
            <li>Relatum does not endorse any protocol listed.</li>
          </ul>
          <div className="charter">
            Committed as a project charter at v0.1. Amendment requires written EF agreement, encoded in <code>CHARTER.md</code>.
          </div>
        </div>

        <div className="does-card does-do">
          <div className="hd"><span className="mark-check">✓</span><h2>What Relatum does do</h2></div>
          <ul>
            <li>Aggregates risk feed coverage for the top Ethereum DeFi protocols in one place.</li>
            <li>Surfaces governance data from onchain sources (Safe API) and verifiable registries.</li>
            <li>Tracks which feeds have — and have not — assessed each protocol.</li>
            <li>Links directly to source assessments. Ratings are shown verbatim, never normalized.</li>
            <li>Maintains an open, community-correctable data registry on GitHub.</li>
          </ul>
        </div>
      </div>

      <div className="mblock gaps-as-data">
        <h2>Coverage gaps as data</h2>
        <p>A protocol that has not been assessed by any risk feed is itself a signal. The absence of coverage is information. A newer protocol with 2 feeds covering it is a meaningfully different risk profile from an established one with 15. Relatum makes these gaps visible rather than hiding them behind a composite number.</p>
        <p>In our data model, absence is a typed observation, not a missing row. Every (protocol × feed) cell carries one of four states:</p>
        <div className="cov-state-list">
          <div className="cov-state"><span className="badge cov">covered</span> <span>the feed publishes an assessment of this exact subject; data is in the graph</span></div>
          <div className="cov-state"><span className="badge part">partial</span> <span>the feed covers a related entity (e.g. Pharos on Aave via GHO); the relationship is modeled as an explicit graph edge</span></div>
          <div className="cov-state"><span className="badge none">not covered</span> <span>explicit statement of absence with reason. A typed <code>rfp:CoverageStatement</code> triple, not a TODO.</span></div>
          <div className="cov-state"><span className="badge pending">adapter pending</span> <span>the feed's TTL mapper hasn't been written yet — distinct from "not covered." Visible everywhere this distinction matters.</span></div>
        </div>
      </div>

      <div className="mblock rdf-substrate">
        <div className="rdf-head">
          <h2>The data substrate — RDF knowledge graph</h2>
          <span className="differentiator">our extension beyond the RFP brief</span>
        </div>
        <p>Every feed assessment is stored as RDF triples. Each provider's methodology, units, and scale are preserved as native graph properties. <strong>Nothing is normalized</strong> or coerced onto a common scale. The aggregator's read API is "give every claim about subject X" — the JOIN happens at query time, never at write time.</p>

        <h3>Vocabulary at a glance</h3>
        <div className="rdf-schema-grid">
          <div className="rdf-card">
            <div className="rdf-card-h">Subjects</div>
            <code>rfp:Protocol</code><code>rfp:Market</code><code>rfp:Vault</code><code>rfp:Stablecoin</code><code>rfp:Curator</code>
          </div>
          <div className="rdf-card">
            <div className="rdf-card-h">Claim types</div>
            <code>rfp:Rating</code><code>rfp:Score</code><code>rfp:Finding</code><code>rfp:CoverageStatement</code>
          </div>
          <div className="rdf-card">
            <div className="rdf-card-h">Provenance</div>
            <code>rfp:statedBy</code><code>rfp:sourceURL</code><code>rfp:observedAt</code><code>rfp:methodologyURL</code>
          </div>
          <div className="rdf-card">
            <div className="rdf-card-h">Verbatim framing</div>
            <code>rfp:dimension</code><code>rfp:ratingScale</code><code>rfp:ratingValue</code><code>rfp:scoreValue</code>
          </div>
        </div>

        <p className="rdf-footnote">Why an RDF substrate is the structural enforcement of <em>no composite scoring</em>: the data model has no predicate for "Relatum's score." A composite would require introducing one, which requires charter amendment, which requires written EF agreement. Neutrality is enforced at the schema layer, not at the UI layer.</p>
      </div>

      <div className="mblock">
        <h2>Data provenance</h2>
        <p>Every data point on Relatum carries a source tag. Provenance is rendered next to the value on every page; auditable to its origin URL at query time.</p>
        <div className="prov-list">
          <div className="prov-row"><span className="prov onchain">[onchain]</span><span>fetched directly from chain or a verified onchain source (Safe API, etc.). Highest assurance.</span></div>
          <div className="prov-row"><span className="prov feed">[feed]</span><span>sourced from a feed provider's published assessment via API or open repo. Re-verifiable at the source URL.</span></div>
          <div className="prov-row"><span className="prov curated">[curated]</span><span>manually researched and added by a human curator via PR. Logged with editor and timestamp.</span></div>
          <div className="prov-row"><span className="prov self">[self-reported]</span><span>provided by the protocol team directly. Treated as a claim, not a fact.</span></div>
        </div>
      </div>

      <div className="mblock">
        <h2>The feed registry</h2>
        <p>Full list of {data ? `all ${data.feeds.length} providers` : 'all providers'} Relatum aggregates from. Each feed has its own methodology and focus. <strong>We do not rank them.</strong> Adapter status reflects whether the TTL mapper that consumes the feed's output is wired up; "pending" feeds appear in the matrix with a distinct visual state.</p>
        {data ? (
          <table className="feeds-table">
            <thead>
              <tr><th>Feed</th><th>Type</th><th>Focus</th><th>Methodology one-liner</th><th>Adapter</th><th>Schema</th></tr>
            </thead>
            <tbody>
              {data.feeds.map(f => (
                <tr key={f.id}>
                  <td className="feed-name">{f.name}</td>
                  <td className="type-cell"><span className="type-chip" data-type={f.type}>{f.type}</span></td>
                  <td className="focus">{f.focus}</td>
                  <td className="focus">{f.methodology}</td>
                  <td><span className={`badge ${f.adapterStatus === 'implemented' ? 'cov' : 'pending'}`}>{f.adapterStatus}</span></td>
                  <td className="schema-cell">{f.schemaDoc ? <a href={f.schemaDoc} target="_blank" rel="noreferrer" className="schema-link">{f.id}.yaml</a> : <span className="dim">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p>Loading feed registry…</p>}
      </div>

      <div className="repo-link">
        <a href="https://github.com/ivanvolov/relatum-risk-aggregator" target="_blank" rel="noreferrer">github.com/ivanvolov/relatum-risk-aggregator →</a>
      </div>

      <footer className="page-footer">
        Mockup submitted to the EF App Relations RFP <em>Neutral DeFi Risk Intelligence Aggregator</em> by IVa.
      </footer>
    </main>
  );
}
