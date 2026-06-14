/* Relatum mockup — table sort / filter and matrix rendering */

function fmtUsd(n) {
  if (n === 0) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "k";
  return "$" + n;
}

function initials(name) {
  return name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function badge(status) {
  if (status === "cov")  return '<span class="badge cov">covered</span>';
  if (status === "part") return '<span class="badge part">partial</span>';
  if (status === "none") return '<span class="badge none">not yet</span>';
  return '<span class="badge dim">—</span>';
}

function dotCell(status) {
  const cls = status === "cov" ? "cov" : status === "part" ? "part" : "none";
  const title = status === "cov" ? "Covered" : status === "part" ? "Partial coverage — see protocol page" : "Not yet covered";
  return `<span class="dot-cell ${cls}" title="${title}"></span>`;
}

/* ---------- Summary matrix rendering ---------- */
function renderMatrix(targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  const R = window.RELATUM;

  let html = "";
  html += '<thead><tr>';
  html += '<th data-key="name" class="sortable">Protocol</th>';
  html += '<th data-key="category" class="sortable">Category</th>';
  html += '<th data-key="tvl_usd" class="sortable">ETH TVL</th>';
  html += '<th class="gov-col" title="Multisig threshold · timelock (from Safe API when available)">Gov</th>';
  html += '<th data-key="coverage" class="sortable" title="Number of feeds covering (full or partial)">Feeds</th>';
  for (const f of R.FEEDS) {
    html += `<th class="feed" title="${f.name} — ${f.focus}">${f.name}</th>`;
  }
  html += '</tr></thead>';

  html += '<tbody>';
  for (const p of R.PROTOCOLS) {
    const cov = R.COVERAGE[p.slug] || {};
    const sumCov = R.FEEDS.reduce((acc, f) => acc + (cov[f.id] === "cov" ? 1 : cov[f.id] === "part" ? 0.5 : 0), 0);
    const coveredFeeds = R.FEEDS.reduce((acc, f) => acc + (cov[f.id] === "cov" || cov[f.id] === "part" ? 1 : 0), 0);
    const isFamily = !!p.versions;

    html += `<tr data-proto="${p.slug}" data-coverage="${sumCov}"${isFamily ? ' class="family-row"' : ''}>`;

    if (isFamily) {
      html += `<td class="proto"><a href="protocol-${p.slug}.html"><span class="arrow">▶</span><span>${p.name}<span class="version-count">(${p.versions.length} versions)</span></span></a></td>`;
    } else {
      html += `<td class="proto"><a href="protocol-${p.slug}.html"><span class="avatar">${initials(p.name)}</span><span>${p.name}<span class="meta">${p.family}</span></span></a></td>`;
    }
    html += `<td><span class="badge dim">${p.category}</span></td>`;
    html += `<td class="tvl">${p.tvl_usd ? fmtUsd(p.tvl_usd) : (p.volume_usd_24h ? fmtUsd(p.volume_usd_24h) + "/d" : "—")}</td>`;
    html += `<td class="gov-cell">${p.governance_summary || "—"}</td>`;
    html += `<td class="tvl">${coveredFeeds} feeds</td>`;
    for (const f of R.FEEDS) {
      const st = cov[f.id] || "none";
      const inline = p.inlineRating && p.inlineRating[f.id];
      if (inline && (st === "cov" || st === "part")) {
        const ratingClass = inline.toLowerCase().replace(/[^a-z0-9]/g, "-");
        html += `<td class="cell"><span class="inline-rating ${ratingClass}">${inline}</span></td>`;
      } else {
        html += `<td class="cell">${dotCell(st)}</td>`;
      }
    }
    html += `</tr>`;
  }
  html += '</tbody>';
  wrap.innerHTML = html;

  /* sort handlers */
  wrap.querySelectorAll("thead th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      const rows = Array.from(wrap.querySelectorAll("tbody tr"));
      const dir = th.dataset.dir === "asc" ? "desc" : "asc";
      th.dataset.dir = dir;
      const m = dir === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        let av, bv;
        if (key === "name") {
          av = a.querySelector(".proto").textContent.trim().toLowerCase();
          bv = b.querySelector(".proto").textContent.trim().toLowerCase();
        } else if (key === "tvl_usd") {
          av = parseFloat(a.children[2].textContent.replace(/[$BMk/d]/g, "")) || 0;
          bv = parseFloat(b.children[2].textContent.replace(/[$BMk/d]/g, "")) || 0;
          // crude: B/M unit handling
          if (a.children[2].textContent.includes("B")) av *= 1000;
          if (b.children[2].textContent.includes("B")) bv *= 1000;
        } else if (key === "coverage") {
          av = parseFloat(a.dataset.coverage);
          bv = parseFloat(b.dataset.coverage);
        } else {
          av = a.children[1].textContent;
          bv = b.children[1].textContent;
        }
        return av < bv ? -m : av > bv ? m : 0;
      });
      const tbody = wrap.querySelector("tbody");
      rows.forEach(r => tbody.appendChild(r));
    });
  });

  /* search filter */
  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.toLowerCase();
      wrap.querySelectorAll("tbody tr").forEach(r => {
        const txt = r.textContent.toLowerCase();
        r.style.display = txt.includes(q) ? "" : "none";
      });
    });
  }

  /* category filter — pill chips (POC pattern) */
  const catChips = document.getElementById("catChips");
  if (catChips) {
    const cats = Array.from(new Set(R.PROTOCOLS.map(p => p.category))).sort();
    /* "All" chip first, then per-category */
    let chipsHtml = `<button class="cat-chip active" data-cat="">All</button>`;
    cats.forEach(c => { chipsHtml += `<button class="cat-chip" data-cat="${c}">${c}</button>`; });
    catChips.innerHTML = chipsHtml;
    catChips.addEventListener("click", e => {
      const btn = e.target.closest(".cat-chip");
      if (!btn) return;
      catChips.querySelectorAll(".cat-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const v = btn.dataset.cat;
      wrap.querySelectorAll("tbody tr").forEach(r => {
        if (!v) { r.style.display = ""; return; }
        const c = r.children[1].textContent.trim();
        r.style.display = c === v ? "" : "none";
      });
    });
  }

  /* coverage counters */
  const counters = document.getElementById("matrixStats");
  if (counters) {
    let covCount = 0, partCount = 0, noneCount = 0;
    for (const p of R.PROTOCOLS) {
      const cov = R.COVERAGE[p.slug] || {};
      for (const f of R.FEEDS) {
        if (cov[f.id] === "cov") covCount++;
        else if (cov[f.id] === "part") partCount++;
        else noneCount++;
      }
    }
    const total = R.PROTOCOLS.length * R.FEEDS.length;
    counters.innerHTML = `
      <div class="stat"><div class="k">Protocols</div><div class="v">${R.PROTOCOLS.length}</div></div>
      <div class="stat"><div class="k">Feeds</div><div class="v">${R.FEEDS.length}</div></div>
      <div class="stat"><div class="k">Matrix cells</div><div class="v">${total}</div></div>
      <div class="stat"><div class="k">Covered</div><div class="v" style="color:var(--ok)">${covCount}</div></div>
      <div class="stat"><div class="k">Partial</div><div class="v" style="color:var(--partial)">${partCount}</div></div>
      <div class="stat"><div class="k">Not yet</div><div class="v" style="color:var(--no)">${noneCount}</div></div>
    `;
  }
}

/* ---------- Protocol detail rendering ---------- */
function renderProtocolDetail(targetId, slug) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  const R = window.RELATUM;
  if (slug !== "aave") {
    wrap.innerHTML = `<div class="mblock"><h2>${slug} — coming in M1</h2><p>This protocol is in the seed-20 list but its detail page is auto-generated from the RDF graph at build time. The mockup shows Aave v3 fully populated as a worked example.</p><p><a href="protocol-aave.html">→ See the Aave v3 worked example</a></p></div>`;
    return;
  }

  const D = R.AAVE_V3_DETAIL;
  let html = "";

  /* header with TVL right-rail */
  html += `<div class="detail-header">`;
  html += `<div class="avatar-lg">${initials(D.name)}</div>`;
  html += `<div class="header-text">`;
  html += `<div class="breadcrumbs"><a href="index.html">All protocols</a> &nbsp;/&nbsp; ${D.category} &nbsp;/&nbsp; ${D.name}</div>`;
  html += `<h1>${D.name}</h1>`;
  html += `</div>`;
  html += `<div class="header-tvl"><div class="lbl">TVL</div><div class="val">${fmtUsd(D.tvl_usd)}</div></div>`;
  html += `</div>`;
  html += `<p class="lede">${D.description}</p>`;
  if (D.lastUpdated) html += `<div class="updated-stamp">Data last updated: ${D.lastUpdated}</div>`;

  html += `<div class="detail-grid">`;
  /* left column — sidecards */
  html += `<div>`;
  for (const sc of D.sidecards) {
    html += `<div class="sidecard"><h3>${sc.title}${sc.prov ? `<span class="prov ${sc.prov}">${sc.prov}</span>` : ""}</h3>`;
    for (const r of sc.rows) {
      html += `<div class="kv"><span class="k">${r.k}</span><span class="v">${r.url ? `<a href="${r.url}" target="_blank">${r.v}</a>` : r.v}</span></div>`;
    }
    /* graceful-degrade notice on the Governance card */
    if (sc.title === "Governance" && D.governance_degrade_note) {
      html += `<div class="degrade-notice"><span class="lbl">Source →</span> ${D.governance_degrade_note}. <a href="#" class="cta-link">Flag inaccuracies via GitHub</a></div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  /* right column — feed cards */
  html += `<div>`;
  /* H2 + counter */
  const coveredCount = D.feeds.filter(f => f.status === "cov" || f.status === "part").length;
  html += `<div class="feeds-section-head"><h2>Risk Intelligence Feeds</h2><span class="feed-counter"><strong>${coveredCount}</strong> risk feeds available</span></div>`;
  html += `<p class="feeds-section-sub">Each card is one provider's view of this protocol. Methodology shown before findings. Ratings shown verbatim where they exist. Coverage gaps below.</p>`;
  html += `<div class="feed-grid">`;

  for (const fc of D.feeds) {
    const f = R.feedById(fc.feedId);
    if (!f) continue;
    html += `<div class="feed-card" data-type="${f.type}">`;
    html += `<div class="head">`;
    html += `<span class="name">${f.name}</span>`;
    html += `<span class="type-chip">${f.type}</span>`;
    html += `<span class="focus">${f.focus}</span>`;
    html += `<span class="spacer"></span>`;
    html += `${badge(fc.status)}`;
    if (fc.sourceUrl) html += ` &nbsp; <a class="source" href="${fc.sourceUrl}" target="_blank">${fc.sourceUrl.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a>`;
    html += `</div>`;

    if (fc.status === "cov" || fc.status === "part") {
      if (fc.claims && fc.claims.length) {
        html += `<div class="body">`;
        if (fc.methodology) html += `<div class="methodology">${fc.methodology}</div>`;
        html += `<div class="claims">`;
        for (const c of fc.claims) {
          const lvl = c.level ? c.level : "";
          html += `<div class="claim ${lvl}"><div class="dim">${c.dim}</div><div class="val">${c.value}</div><div class="scale">${c.scale}</div></div>`;
        }
        html += `</div>`;
        if (fc.notable) html += `<div class="notable"><div class="lbl">${fc.notable.label}</div><div class="text">${fc.notable.text}</div></div>`;
        if (fc.findings) html += `<div class="notable findings"><div class="lbl">${fc.findings.label}</div><div class="text">${fc.findings.text}</div></div>`;
        /* observation date footer (POC pattern: "View assessment → [feed] YYYY-MM-DD") */
        if (fc.sourceUrl || fc.observedAt) {
          html += `<div class="observe-date">`;
          if (fc.sourceUrl) html += `<a href="${fc.sourceUrl}" target="_blank">View assessment →</a>`;
          html += ` <span class="prov feed">[feed]</span>`;
          if (fc.observedAt) html += ` <span class="date">${fc.observedAt}</span>`;
          html += `</div>`;
        }
        html += `</div>`;
      } else {
        /* partial coverage, no claims to render */
        html += `<div class="body">`;
        if (fc.methodology) html += `<div class="methodology">${fc.methodology}</div>`;
        if (fc.coverageReason) html += `<div class="notable"><div class="lbl">Coverage</div><div class="text">${fc.coverageReason}</div></div>`;
        if (fc.notable) html += `<div class="notable"><div class="lbl">${fc.notable.label}</div><div class="text">${fc.notable.text}</div></div>`;
        if (fc.sourceUrl || fc.observedAt) {
          html += `<div class="observe-date">`;
          if (fc.sourceUrl) html += `<a href="${fc.sourceUrl}" target="_blank">View assessment →</a>`;
          html += ` <span class="prov feed">[feed]</span>`;
          if (fc.observedAt) html += ` <span class="date">${fc.observedAt}</span>`;
          html += `</div>`;
        }
        html += `</div>`;
      }
    } else {
      html += `<div class="coverage-only"><span class="stamp">not yet covered</span>${fc.coverageReason || "Not in this feed's covered set."}</div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;  /* /.feed-grid */

  /* "Not yet covered by:" footer (between feed grid and audit history) */
  const notYet = D.feeds.filter(fc => fc.status === "none").map(fc => R.feedById(fc.feedId)).filter(Boolean);
  if (notYet.length) {
    html += `<div class="not-yet-covered"><span class="lbl">Not yet covered by:</span> ${notYet.map(f => `<span class="feed-name">${f.name}</span>`).join(", ")}</div>`;
  }

  html += `</div>`;  /* /right column */
  html += `</div>`;  /* /.detail-grid */

  /* Standalone full-width blocks below the grid */

  /* Audit History */
  if (D.audit_history && D.audit_history.length) {
    html += `<section class="full-block audit-block">`;
    html += `<h2>Audit History <span class="prov self">self-reported</span></h2>`;
    html += `<table class="audit-table"><thead><tr><th>Firm</th><th>Date</th><th>Report</th></tr></thead><tbody>`;
    for (const a of D.audit_history) {
      html += `<tr><td class="firm">${a.firm}</td><td class="date">${a.date}</td><td class="report">${a.report_url ? `<a href="${a.report_url}" target="_blank">View →</a>` : "—"}</td></tr>`;
    }
    html += `</tbody></table></section>`;
  }

  /* Incident History */
  html += `<section class="full-block incident-block">`;
  html += `<h2>Incident History <span class="prov curated">curated</span></h2>`;
  if (D.incidents && D.incidents.length) {
    html += `<table class="incident-table"><thead><tr><th>Date</th><th>Severity</th><th>Description</th><th>Loss (USD)</th></tr></thead><tbody>`;
    for (const i of D.incidents) {
      html += `<tr><td>${i.date}</td><td>${i.severity}</td><td>${i.description}</td><td class="amount">${i.loss_usd ? fmtUsd(i.loss_usd) : "—"}</td></tr>`;
    }
    html += `</tbody></table>`;
  } else {
    html += `<div class="empty-state">No known incidents on record.</div>`;
  }
  html += `</section>`;

  /* Submit-correction CTA footer */
  html += `<div class="correct-cta">See something wrong? This data is open source. <a href="#" target="_blank">Submit a correction on GitHub →</a></div>`;

  wrap.innerHTML = html;
}

/* ---------- Methodology / feed registry page ---------- */
function renderFeedRegistry(targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  const R = window.RELATUM;
  let html = '<table class="feeds-table"><thead><tr><th>Feed</th><th>Type</th><th>Focus</th><th>Methodology one-liner</th></tr></thead><tbody>';
  for (const f of R.FEEDS) {
    html += `<tr>`;
    html += `<td class="feed-name">${f.name}</td>`;
    html += `<td class="type-cell"><span class="type-chip" data-type="${f.type}">${f.type}</span></td>`;
    html += `<td class="focus">${f.focus}</td>`;
    html += `<td class="focus">${f.methodology}</td>`;
    html += `</tr>`;
  }
  html += "</tbody></table>";
  wrap.innerHTML = html;
}
