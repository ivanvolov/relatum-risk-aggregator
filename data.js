/* Relatum mockup data layer.
 * In production this is generated from the RDF graph (Turtle files in
 * data/rdf/) — here it's pre-baked as JS so the
 * mockup runs by double-clicking index.html without a server. */

window.RELATUM = (function () {

  /* ---------- Feed registry (15 feeds: 14 RFP-listed + StableWatch) ---------- */
  const FEEDS = [
    { id: "defiscan",       name: "DeFiScan",        type: "Rating",       focus: "Decentralization maturity (Stage 0/1/2) + permission scanner",       methodology: "Reviews each protocol against a fixed Stage 0/1/2 framework + 5-axis L/M/H risk on chain, upgradeability, autonomy, exit window, accessibility.", schemaDoc: "data/feeds/defiscan.yaml" },
    { id: "blockanalitica", name: "Block Analitica", type: "Dashboard",    focus: "Quantitative on-chain risk dashboards for lending markets",            methodology: "Per-protocol live dashboards. Surfaces TVL, utilization, LTV, liquidation thresholds, borrower concentration, bad debt. No composite score.", schemaDoc: "data/feeds/blockanalitica.yaml" },
    { id: "curatorwatch",   name: "CuratorWatch",    type: "Dashboard",    focus: "Vault curator allocations and risk on Morpho/Aave/Euler/Compound/Spark", methodology: "Tracks curators (not protocols). Vault Grade A+..NR, jurisdiction disclosed, AUM, vaults managed, recent liquidations.", schemaDoc: "data/feeds/curatorwatch.yaml" },
    { id: "defipunkd",      name: "DeFiPunk'd",      type: "Rating",       focus: "Multi-dimension via distributed LLM consensus",                        methodology: "Control, Exit, Autonomy, Open Access, Verifiability scores produced by distributed LLM consensus across many model providers.", schemaDoc: "data/feeds/defipunkd.yaml" },
    { id: "pharos",         name: "Pharos",          type: "Monitoring",   focus: "Stablecoin classification + safety grading + depeg early warning",     methodology: "5-dim A+..F grade (peg-stability, liquidity, resilience, decentralization, dependency) plus PSI / DEWS / Mint Authority numeric scores.", schemaDoc: "data/feeds/pharos.yaml" },
    { id: "defisphere",     name: "DeFi Sphere",     type: "Rating",       focus: "Cross-protocol lending market analytics",                              methodology: "Market-risk and liquidity-risk scores per (protocol, market). Built on Block Analitica infrastructure. Oracle and settlement risk on roadmap.", schemaDoc: "data/feeds/defisphere.yaml" },
    { id: "defisaver",      name: "DeFi Saver",      type: "Dashboard",    focus: "Per-position health and liquidation statistics",                       methodology: "Execution-first. Surfaces health factor, safety ratio, liquidation price per user position. No protocol-level risk score.", schemaDoc: "data/feeds/defisaver.yaml" },
    { id: "credora",        name: "Credora",         type: "Rating",       focus: "Institutional-grade credit ratings, A+..D scale",                      methodology: "100,000 Monte Carlo simulations per market, calibrated against 30+ years of TradFi probability-of-default data. One letter rating per token/vault/lending-pair.", schemaDoc: "data/feeds/credora.yaml" },
    { id: "risklayer",      name: "RiskLayer",       type: "Rating",       focus: "Proof-of-Risk consensus on EigenLayer",                                methodology: "AI-pipeline (discovery → contract → governance → audit → scoring) + Monte Carlo. Validator-attested risk scores 0–100, settled on EigenLayer.", schemaDoc: "data/feeds/risklayer.yaml" },
    { id: "pigi",           name: "pigi.finance",    type: "Dashboard",    focus: "50+ protocol vault analytics, risk-adjusted yield",                    methodology: "Historical exploits, holder concentration, risk-adjusted APY per vault." },
    { id: "xerberus",       name: "Xerberus",        type: "Rating",       focus: "300+ subscores across 85+ mechanisms",                                 methodology: "Investor-focused open-source vault rating. Decomposes risk into mechanism-level subscores.", schemaDoc: "data/feeds/xerberus.yaml" },
    { id: "zyfai",          name: "Zyfai Risk",      type: "Dashboard",    focus: "Real-time pool-level risk scores",                                     methodology: "Risk metrics, TVL, APY, security grades across liquidity pools." },
    { id: "llamarisk",      name: "LlamaRisk",       type: "Research",     focus: "Protocol risk research + parameter recommendations",                   methodology: "Long-form research; collateral and governance risk; parameter proposals to DAOs (Curve, Sky)." },
    { id: "philidor",       name: "Philidor",        type: "Rating",       focus: "Deterministic vault scoring, 700+ vaults",                             methodology: "Three-vector framework — asset quality, platform code maturity, governance controls. Open methodology.", schemaDoc: "data/feeds/philidor.yaml" },
    { id: "stablewatch",    name: "Stablewatch",     type: "Dashboard",    focus: "Yield-bearing stablecoin landscape (60+ assets)",                      methodology: "Real-time APY, TVL, yield paid out. Category framework (blue-chip vs hidden-gem) with qualitative per-category risk vectors.", schemaDoc: "data/feeds/stablewatch.yaml" },
  ];

  /* ---------- 20 seed protocols (from RFP Section 3, with TVL from DefiLlama)
       governance_summary format: "<threshold> · <timelock>" or just timelock or "—" if neither
       inlineRating: per-feed verbatim text to render INSIDE the cell (POC pattern for DeFiScan stage + Exponential.fi letter) ---------- */
  const PROTOCOLS = [
    { slug: "lido",         name: "Lido",          category: "Liquid Staking",  tvl_usd: 14_940_071_550, family: "Lido", twitter: "LidoFinance",
      governance_summary: "5/7 · 3d",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "aave",         name: "Aave",          category: "Lending",         tvl_usd: 10_130_542_675, family: "Aave", versions: ["v3","v4"], twitter: "aave",
      governance_summary: "5/9 · 2d",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "spark",        name: "Spark",         category: "Lending",         tvl_usd:  7_100_000_000, family: "Sky",  twitter: "sparkdotfi",
      governance_summary: "2d",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "sky",          name: "Sky (MakerDAO)", category: "CDP / Stablecoin", tvl_usd: 6_042_932_584, family: "Sky", twitter: "SkyEcosystem",
      governance_summary: "2d",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "ethena",       name: "Ethena",        category: "Synthetic Yield", tvl_usd:  4_837_397_870, family: "Ethena", twitter: "ethena",
      governance_summary: "—",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "morpho",       name: "Morpho",        category: "Lending",         tvl_usd:  3_476_196_272, family: "Morpho", versions: ["v1","v2"], twitter: "MorphoLabs",
      governance_summary: "5/9 · 7d",
      inlineRating: { defiscan: "Stage 1" } },
    { slug: "etherfi",      name: "ether.fi",      category: "Liquid Restaking", tvl_usd: 2_970_000_000, family: "ether.fi", twitter: "ether_fi",
      governance_summary: "—" },
    { slug: "uniswap",      name: "Uniswap",       category: "DEX / AMM",       tvl_usd:  1_910_000_000, family: "Uniswap", versions: ["v3","v4","UniswapX"], twitter: "Uniswap",
      governance_summary: "2d",
      inlineRating: { defiscan: "Stage 2" } },
    { slug: "curve",        name: "Curve",         category: "DEX / AMM",       tvl_usd:  1_430_000_000, family: "Curve", twitter: "CurveFinance",
      governance_summary: "4/6 · 3d",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "compound",     name: "Compound",      category: "Lending",         tvl_usd:  1_050_000_000, family: "Compound", versions: ["v2","v3"], twitter: "compoundfinance",
      governance_summary: "2d",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "rocketpool",   name: "Rocket Pool",   category: "Liquid Staking",  tvl_usd:    900_000_000, family: "Rocket Pool", twitter: "Rocket_Pool",
      governance_summary: "—" },
    { slug: "pendle",       name: "Pendle",        category: "Yield / Vault",   tvl_usd:    800_000_000, family: "Pendle", twitter: "pendle_fi",
      governance_summary: "—",
      inlineRating: { defiscan: "Stage 0" } },
    { slug: "fluid",        name: "Fluid",         category: "Lending",         tvl_usd:    580_000_000, family: "Fluid (Instadapp)", twitter: "0xfluid",
      governance_summary: "—" },
    { slug: "liquity",      name: "Liquity",       category: "Lending / CDP",   tvl_usd:    200_000_000, family: "Liquity", versions: ["v1","v2"], twitter: "LiquityProtocol",
      governance_summary: "—",
      inlineRating: { defiscan: "Stage 2" } },
    { slug: "yearn",        name: "Yearn",         category: "Yield / Vault",   tvl_usd:    160_000_000, family: "Yearn", twitter: "yearnfi",
      governance_summary: "—" },
    { slug: "euler",        name: "Euler",         category: "Lending",         tvl_usd:    140_000_000, family: "Euler", versions: ["v1","v2"], twitter: "eulerfinance",
      governance_summary: "—" },
    { slug: "mellow",       name: "Mellow",        category: "Yield / Vault",   tvl_usd:    120_000_000, family: "Mellow", twitter: "mellowprotocol",
      governance_summary: "—" },
    { slug: "balancer",     name: "Balancer",      category: "DEX / AMM",       tvl_usd:     90_000_000, family: "Balancer", versions: ["v2","v3","CoW AMM"], twitter: "Balancer",
      governance_summary: "—" },
    { slug: "gearbox",      name: "Gearbox",       category: "Lending",         tvl_usd:     14_000_000, family: "Gearbox", twitter: "GearboxProtocol",
      governance_summary: "—" },
    { slug: "cowswap",      name: "CoW Swap",      category: "Swap Aggregator", tvl_usd:              0, family: "CoW",  volume_usd_24h: 280_000_000, twitter: "CoWSwap",
      governance_summary: "—" },
  ];

  /* ---------- Coverage matrix: protocol × feed → status + optional source URL.
       cov = covered  |  part = partial  |  none = not yet covered  ---------- */
  const COVERAGE = {
    /*               defiscan blockanalitica curatorwatch defipunkd pharos defisphere defisaver credora risklayer pigi xerberus zyfai llamarisk philidor stablewatch */
    aave:       { defiscan:"cov", blockanalitica:"cov", curatorwatch:"part", defipunkd:"none", pharos:"part", defisphere:"cov", defisaver:"cov", credora:"cov", risklayer:"part", pigi:"part", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"part" },
    sky:        { defiscan:"cov", blockanalitica:"cov", curatorwatch:"part", defipunkd:"none", pharos:"cov",  defisphere:"none", defisaver:"cov", credora:"part", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"cov" },
    spark:      { defiscan:"cov", blockanalitica:"cov", curatorwatch:"cov", defipunkd:"none", pharos:"part", defisphere:"cov", defisaver:"cov", credora:"part", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"part" },
    morpho:     { defiscan:"cov", blockanalitica:"cov", curatorwatch:"cov", defipunkd:"none", pharos:"none", defisphere:"cov", defisaver:"cov", credora:"cov", risklayer:"none", pigi:"cov", xerberus:"part", zyfai:"none", llamarisk:"cov", philidor:"cov", stablewatch:"none" },
    compound:   { defiscan:"cov", blockanalitica:"cov", curatorwatch:"part", defipunkd:"none", pharos:"none", defisphere:"cov", defisaver:"cov", credora:"cov", risklayer:"none", pigi:"part", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"none" },
    euler:      { defiscan:"part", blockanalitica:"part", curatorwatch:"part", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"part", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"part", philidor:"none", stablewatch:"none" },
    liquity:    { defiscan:"cov", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"cov",  defisphere:"cov",  defisaver:"none", credora:"part", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"none" },
    fluid:      { defiscan:"part", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"cov", credora:"none", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"part", philidor:"none", stablewatch:"none" },
    gearbox:    { defiscan:"none", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"none", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"part", philidor:"none", stablewatch:"none" },
    uniswap:    { defiscan:"cov", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"none", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"part", llamarisk:"part", philidor:"none", stablewatch:"none" },
    curve:      { defiscan:"cov", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"part", defisphere:"none", defisaver:"none", credora:"none", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"part", llamarisk:"cov", philidor:"none", stablewatch:"part" },
    balancer:   { defiscan:"none", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"none", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"part", llamarisk:"part", philidor:"none", stablewatch:"none" },
    cowswap:    { defiscan:"none", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"none", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"none", philidor:"none", stablewatch:"none" },
    yearn:      { defiscan:"part", blockanalitica:"none", curatorwatch:"part", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"part", risklayer:"none", pigi:"cov", xerberus:"cov", zyfai:"none", llamarisk:"cov", philidor:"cov", stablewatch:"none" },
    pendle:     { defiscan:"cov", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"none", risklayer:"none", pigi:"part", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"none" },
    mellow:     { defiscan:"none", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"none", risklayer:"none", pigi:"none", xerberus:"part", zyfai:"none", llamarisk:"none", philidor:"none", stablewatch:"none" },
    ethena:     { defiscan:"cov", blockanalitica:"none", curatorwatch:"part", defipunkd:"none", pharos:"cov",  defisphere:"none", defisaver:"none", credora:"cov", risklayer:"none", pigi:"part", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"cov" },
    etherfi:    { defiscan:"none", blockanalitica:"none", curatorwatch:"part", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"part", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"part", philidor:"none", stablewatch:"none" },
    lido:       { defiscan:"cov", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"part", credora:"part", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"cov", philidor:"none", stablewatch:"none" },
    rocketpool: { defiscan:"none", blockanalitica:"none", curatorwatch:"none", defipunkd:"none", pharos:"none", defisphere:"none", defisaver:"none", credora:"part", risklayer:"none", pigi:"none", xerberus:"none", zyfai:"none", llamarisk:"part", philidor:"none", stablewatch:"none" },
  };

  /* ---------- Aave v3 Ethereum — fully populated detail (extracted from the RDF graph) ---------- */
  const AAVE_V3_DETAIL = {
    slug: "aave",
    name: "Aave v3 — Ethereum Core",
    category: "Lending",
    tvl_usd: 10_130_542_675,
    description: "Open-source, non-custodial lending protocol. Users supply ERC-20 assets and borrow against them with variable rates; Aave also issues GHO, its native overcollateralized stablecoin.",
    lastUpdated: "2026-06-14",
    governance_degrade_note: "Safe API fetch failed — showing static data",

    audit_history: [
      { firm: "Trail of Bits",        date: "2022-11", report_url: "https://github.com/trailofbits/publications/blob/master/reviews/2022-11-aave-v3-securityreview.pdf" },
      { firm: "OpenZeppelin",         date: "2022-08", report_url: "https://blog.openzeppelin.com/aave-v3-audit/" },
      { firm: "Sigma Prime",          date: "2022-08", report_url: "https://github.com/sigp/public-audits/blob/master/reports/aave-v3/review.pdf" },
      { firm: "ABDK Consulting",      date: "2022-06", report_url: "https://github.com/aave/aave-v3-core/tree/master/audits" },
      { firm: "Certora (formal verification)", date: "2022-05", report_url: "https://www.certora.com/reports/Formal_Verification_Report_for_Aave_v3.pdf" },
    ],

    incidents: [],  // empty → renders "No known incidents on record"

    sidecards: [
      {
        title: "Identity",
        rows: [
          { k: "Slug",      v: "aave-v3-ethereum" },
          { k: "Chain",     v: "Ethereum mainnet" },
          { k: "Category",  v: "Lending" },
          { k: "Website",   v: "aave.com", url: "https://aave.com" },
          { k: "X",         v: "@aave",     url: "https://x.com/aave" },
          { k: "GitHub",    v: "aave-dao/aave-v3-origin", url: "https://github.com/aave-dao/aave-v3-origin" },
        ]
      },
      {
        title: "TVL & Volume",  prov: "feed",
        rows: [
          { k: "ETH TVL",    v: "$10.13B" },
          { k: "Chains",     v: "20+" },
          { k: "DefiLlama",  v: "aave-v3", url: "https://defillama.com/protocol/aave-v3" },
        ]
      },
      {
        title: "Governance",   prov: "onchain",
        rows: [
          { k: "Snapshot",          v: "aave.eth", url: "https://snapshot.org/#/aave.eth" },
          { k: "Executor",          v: "0xEC56…2252c", url: "https://etherscan.io/address/0xEC568fffba86c094cf06b22134B23074DFE2252c" },
          { k: "Gov v3 Guardian",   v: "Security Council" },
          { k: "Emergency Admin",   v: "Multisig (DAO insiders)" },
          { k: "Risk Council",      v: "Multisig" },
          { k: "Exit window (L2)",  v: "7 days" },
          { k: "Exit window (L1)",  v: "0 days" },
        ]
      },
    ],

    feeds: [
      /* ---------- DeFiScan ---------- */
      {
        feedId: "defiscan",
        status: "cov",
        sourceUrl: "https://defiscan.info/projects/aave/ethereum",
        observedAt: "2025-05-07",
        methodology: "Structural review: assigns Stage 0/1/2 maturity, plus 5-axis L/M/H risks (chain, upgradeability, autonomy, exit window, accessibility). Permission scanner emits per-contract / per-function findings.",
        claims: [
          { dim: "Stage",                value: "0",    scale: "Stage 0..2", level: "high" },
          { dim: "Chain",                value: "L",    scale: "L/M/H",      level: "low" },
          { dim: "Upgradeability",       value: "H",    scale: "L/M/H",      level: "high" },
          { dim: "Autonomy",             value: "H",    scale: "L/M/H",      level: "high" },
          { dim: "Exit window",          value: "H",    scale: "L/M/H",      level: "high" },
          { dim: "Accessibility",        value: "L",    scale: "L/M/H",      level: "low" },
          { dim: "Contracts analyzed",   value: "51",   scale: "count" },
          { dim: "Functions scanned",    value: "746",  scale: "count" },
          { dim: "Permissioned funcs",   value: "412",  scale: "count" },
        ],
        notable: {
          label: "Why Stage 0 — 3 unfixed Stage-1 requirements",
          text: "Loss-of-funds upgrades not protected by ≥7-day exit window OR a Security-Council-compliant multisig (Emergency Admin disqualifies — members are Aave insiders); dependency with High centralization score without mitigation (Chainlink); 1 of 3 fixed (frontend backups exist)."
        },
        findings: {
          label: "Notable permission roles surfaced",
          text: "EMERGENCY_ADMIN multisig can pause any reserve or entire Pool; can disable post-pause liquidation grace period. Risk Council controls GhoDirectMinter caps. Aave Governance has full upgradeability over Pool, aTokens, debt tokens, GhoStabilityModule. Governance v3 Guardian multisig (Security Council compliant) can cancel proposals."
        }
      },

      /* ---------- Block Analitica ---------- */
      {
        feedId: "blockanalitica",
        status: "cov",
        sourceUrl: "https://aave.blockanalitica.com",
        observedAt: "2026-06-14",
        methodology: "Live per-market dashboard. Surfaces observed parameters; no composite score. Sampling the wstETH/USDC market for illustration.",
        claims: [
          { dim: "Utilization",            value: "78.4%", scale: "percent" },
          { dim: "Supply APY",             value: "4.7%",  scale: "percent" },
          { dim: "Borrow APY",             value: "6.9%",  scale: "percent" },
          { dim: "Max LTV",                value: "75%",   scale: "percent" },
          { dim: "Liquidation threshold",  value: "78%",   scale: "percent" },
          { dim: "Liquidation bonus",      value: "5%",    scale: "percent" },
          { dim: "Reserve factor",         value: "15%",   scale: "percent" },
          { dim: "Debt ceiling",           value: "$1.0B", scale: "USD" },
          { dim: "Top-1 borrower share",   value: "18%",   scale: "percent", level: "med" },
          { dim: "Bad debt",               value: "$0",    scale: "USD", level: "low" },
        ],
        notable: {
          label: "Sampled market: wstETH (collateral) / USDC (debt)",
          text: "BlockAnalitica runs a similar dashboard for every active Aave reserve. The graph stores one Market entity per (collateral, debt) pair with ~10 numeric metrics each — easily ~300 triples per protocol when fully expanded."
        }
      },

      /* ---------- Pharos (via GHO) ---------- */
      {
        feedId: "pharos",
        status: "part",
        sourceUrl: "https://pharos.watch/stablecoin/gho-aave/",
        observedAt: "2026-06-14",
        methodology: "Pharos rates stablecoins, not protocols. GHO (Aave's stablecoin) carries 5-dimension A+..F grading plus 0–100 forward-looking scores. Claims about GHO project onto Aave via the issues/dependsOn link.",
        claims: [
          { dim: "Overall safety",        value: "B",  scale: "A+..F" },
          { dim: "Peg stability",         value: "A-", scale: "A+..F" },
          { dim: "Liquidity / exit",      value: "A",  scale: "A+..F" },
          { dim: "Decentralization",      value: "B",  scale: "A+..F" },
          { dim: "Dependency risk",       value: "B",  scale: "A+..F" },
          { dim: "Peg score",             value: "88", scale: "0–100" },
          { dim: "Liquidity score",       value: "82", scale: "0–100" },
          { dim: "Mint authority",        value: "60", scale: "0–100", level: "med" },
          { dim: "DEWS (early warning)",  value: "7",  scale: "0–100" },
          { dim: "PSI (stability index)", value: "94", scale: "0–100" },
          { dim: "Blacklist capability",  value: "Upstream", scale: "Yes/Upstream/No" },
          { dim: "Chains deployed",       value: "8",  scale: "count" },
        ],
        notable: {
          label: "Coverage scope",
          text: "Pharos covers GHO (the stablecoin Aave issues), not the Aave protocol itself. Graph stores Pharos's claims about GHO with an explicit edge `aave:GHO rfp:issuedBy aave:v3-ethereum` so the surface still appears on the protocol page — clearly attributed."
        }
      },

      /* ---------- DeFi Sphere ---------- */
      {
        feedId: "defisphere",
        status: "cov",
        sourceUrl: "https://defi-sphere.com",
        observedAt: "2026-06-14",
        methodology: "Cross-protocol lending analytics. Per-market market-risk and liquidity-risk scores on a 0–100 scale. v1 covers Aave + Compound v3 + Morpho + SparkLend + Liquity v2. Oracle/settlement risk on roadmap.",
        claims: [
          { dim: "WETH/USDC market risk",      value: "18", scale: "0–100", level: "low" },
          { dim: "WETH/USDC liquidity risk",   value: "12", scale: "0–100", level: "low" },
          { dim: "wstETH/USDC market risk",    value: "24", scale: "0–100", level: "low" },
          { dim: "wstETH/USDC liquidity risk", value: "18", scale: "0–100", level: "low" },
          { dim: "cbBTC/USDC market risk",     value: "31", scale: "0–100", level: "med" },
          { dim: "cbBTC/USDC liquidity risk",  value: "22", scale: "0–100", level: "low" },
          { dim: "WETH/USDC supply APY 30d",   value: "4.1%", scale: "percent" },
        ],
        notable: {
          label: "Disagreement with DeFiScan",
          text: "DeFiScan rates Upgradeability High because admins can change the rules. Sphere rates market risk Low because borrower LTV is well-distributed and on-chain liquidity is deep. These answer different questions — exactly the case the aggregator exists to display."
        }
      },

      /* ---------- Credora ---------- */
      {
        feedId: "credora",
        status: "cov",
        sourceUrl: "https://credora.network",
        observedAt: "2026-06-01",
        methodology: "100,000 Monte Carlo simulations per market, calibrated against 30+ years of TradFi probability-of-default data. Single A+..D scale per token / vault / lending pair.",
        claims: [
          { dim: "Aave v3 token",             value: "A-", scale: "A+..D",  level: "low" },
          { dim: "WETH/USDC pair",            value: "A",  scale: "A+..D",  level: "low" },
          { dim: "wstETH/USDC pair",          value: "A-", scale: "A+..D",  level: "low" },
          { dim: "PSL 1d @ 95%",              value: "0.4%", scale: "percent of principal" },
          { dim: "PSL 30d @ 99%",             value: "1.8%", scale: "percent of principal" },
        ],
        notable: {
          label: "No-composite-scoring stress test",
          text: "Credora's published output IS itself a composite (A-). The aggregator passes it through verbatim with rfp:statedBy feed:credora — never blended with DeFiScan's Stage rating or Pharos's grades."
        }
      },

      /* ---------- DeFi Saver ---------- */
      {
        feedId: "defisaver",
        status: "cov",
        sourceUrl: "https://app.defisaver.com/aave",
        observedAt: "2026-06-14",
        methodology: "Execution-first: no protocol-level risk score. Surfaces protocol parameter mirror plus per-position health metrics and automated repay / boost / close strategies.",
        claims: [
          { dim: "Health Factor",          value: "exposed", scale: "per-position" },
          { dim: "Safety Ratio",           value: "exposed", scale: "per-position" },
          { dim: "Liquidation Price",      value: "exposed", scale: "per-position, per-asset" },
          { dim: "Repay automation",       value: "available", scale: "boolean" },
          { dim: "Boost automation",       value: "available", scale: "boolean" },
          { dim: "1-tx looping",           value: "yes",       scale: "capability" },
          { dim: "Collateral swap",        value: "yes",       scale: "capability" },
          { dim: "Debt swap",              value: "yes",       scale: "capability" },
          { dim: "Protocol migration",     value: "yes",       scale: "capability" },
        ],
        notable: {
          label: "Why no Rating triples",
          text: "DeFi Saver doesn't publish risk scores — it surfaces parameter mirrors and provides risk-mitigation actions. The graph reflects that: only Finding triples, no Rating triples. Honest coverage, not forced ratings."
        }
      },

      /* ---------- CuratorWatch ---------- */
      {
        feedId: "curatorwatch",
        status: "part",
        sourceUrl: "https://curatorwatch.com",
        coverageReason: "CuratorWatch tracks curator-managed vaults, not lending protocols. Aave-the-protocol has no direct entry. Surfaced instead: curators with material Aave exposure.",
        observedAt: "2026-06-14",
        methodology: "Curator-level grading (A+..NR). Shows AUM, vaults managed, jurisdiction, recent liquidations per curator.",
        notable: {
          label: "Indirect signals via curators allocating to Aave",
          text: "Gauntlet (curator, A-grade) provides risk-parameter recommendations to Aave Governance. Spark Protocol (curator #2 by TVL on CuratorWatch) deposits into Aave; an Aave exploit propagates to Spark vault TVL. These dependencies are stored as explicit edges in the graph."
        }
      },

      /* ---------- DeFi Punk'd ---------- */
      {
        feedId: "defipunkd",
        status: "none",
        coverageReason: "Aave is not currently in DeFi Punk'd's covered set. Coverage candidate flagged."
      },

      /* ---------- RiskLayer ---------- */
      {
        feedId: "risklayer",
        status: "part",
        sourceUrl: "https://risklayer.online",
        coverageReason: "RiskLayer's AI pipeline ingests Aave but composite 0–100 not finalized at scan time.",
        methodology: "6-stage AI pipeline (discovery → contract → governance → audit → scoring) feeding a Monte Carlo engine. Validator-attested via EigenLayer."
      },

      /* ---------- pigi.finance ---------- */
      {
        feedId: "pigi",
        status: "part",
        sourceUrl: "https://pigi.finance",
        coverageReason: "Partial vault analytics on Aave-built vaults (yield-bearing aTokens), not Aave-the-protocol."
      },

      /* ---------- Xerberus ---------- */
      {
        feedId: "xerberus",
        status: "none",
        coverageReason: "Xerberus focuses on vault rating; Aave-the-protocol is out of its primary entity scope."
      },

      /* ---------- Zyfai ---------- */
      {
        feedId: "zyfai",
        status: "none",
        coverageReason: "Zyfai focuses on liquidity-pool risk; Aave reserves are not pools."
      },

      /* ---------- LlamaRisk ---------- */
      {
        feedId: "llamarisk",
        status: "cov",
        sourceUrl: "https://www.llamarisk.com",
        observedAt: "2026-06-10",
        methodology: "Long-form research and parameter recommendations to DAOs. Multiple published Aave research pieces.",
        notable: {
          label: "Surface type",
          text: "LlamaRisk publishes prose research, not structured rating triples. The graph stores reference URLs and topic tags rather than numeric values — illustrating that the data model accommodates Research-type feeds via Finding triples without forcing them into a rating scale."
        }
      },

      /* ---------- Philidor ---------- */
      {
        feedId: "philidor",
        status: "none",
        coverageReason: "Philidor rates vaults, not protocols. Aave aTokens are coverage candidates."
      },

      /* ---------- Stablewatch ---------- */
      {
        feedId: "stablewatch",
        status: "part",
        sourceUrl: "https://www.stablewatch.io",
        coverageReason: "Stablewatch tracks yield-bearing stablecoins. Aave's aTokens (aUSDC, aDAI, aGHO) are candidate entries but not currently indexed; GHO via Pharos is the closest indirect surface."
      },
    ]
  };

  /* ---------- Helpers ---------- */
  const feedById = id => FEEDS.find(f => f.id === id);
  const protoBySlug = slug => PROTOCOLS.find(p => p.slug === slug);

  return { FEEDS, PROTOCOLS, COVERAGE, AAVE_V3_DETAIL, feedById, protoBySlug };
})();
