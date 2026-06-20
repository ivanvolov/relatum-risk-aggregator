// Single source of truth for the feed registry and protocol list consumed by the build pipeline.
// Schema (rfp: vocab) lives in data/ontology/vocab.ttl;
// rfp:Feed instances live in data/ontology/feeds.ttl;
// the per-feed schema docs live in data/adapters/<feed>/schema.yaml.
// This file is the lightweight JS-side mirror used by the build scripts.

export const FEED_REGISTRY = [
  { id: 'defiscan',       name: 'DeFiScan',        type: 'Rating',     focus: 'Decentralization maturity (Stage 0/1/2) + permission scanner',
    methodology: 'Reviews each protocol against a fixed Stage 0/1/2 framework + 5-axis L/M/H risk on chain, upgradeability, autonomy, exit window, accessibility.' },
  { id: 'blockanalitica', name: 'Block Analitica', type: 'Dashboard',  focus: 'Quantitative on-chain risk dashboards for lending markets',
    methodology: 'Per-protocol live dashboards. Surfaces TVL, utilization, LTV, liquidation thresholds, borrower concentration, bad debt. No composite score.' },
  { id: 'curatorwatch',   name: 'CuratorWatch',    type: 'Dashboard',  focus: 'Vault curator allocations and risk on Morpho/Aave/Euler/Compound/Spark',
    methodology: 'Tracks curators (not protocols). Vault Grade A+..NR, jurisdiction disclosed, AUM, vaults managed, recent liquidations.' },
  { id: 'defipunkd',      name: "DeFiPunk'd",      type: 'Rating',     focus: 'Multi-dimension via distributed LLM consensus',
    methodology: 'Control, Exit, Autonomy, Open Access, Verifiability scores produced by distributed LLM consensus across many model providers.' },
  { id: 'pharos',         name: 'Pharos',          type: 'Monitoring', focus: 'Stablecoin classification + safety grading + depeg early warning',
    methodology: '5-dim A+..F grade (peg-stability, liquidity, resilience, decentralization, dependency) plus PSI / DEWS / Mint Authority numeric scores.' },
  { id: 'defisphere',     name: 'DeFi Sphere',     type: 'Rating',     focus: 'Cross-protocol lending market analytics',
    methodology: 'Market-risk and liquidity-risk scores per (protocol, market). Built on Block Analitica infrastructure. Oracle and settlement risk on roadmap.' },
  { id: 'defisaver',      name: 'DeFi Saver',      type: 'Dashboard',  focus: 'Per-position health and liquidation statistics',
    methodology: 'Execution-first. Surfaces health factor, safety ratio, liquidation price per user position. No protocol-level risk score.' },
  { id: 'credora',        name: 'Credora',         type: 'Rating',     focus: 'Institutional-grade credit ratings, A+..D scale',
    methodology: '100,000 Monte Carlo simulations per market, calibrated against 30+ years of TradFi probability-of-default data. One letter rating per token/vault/lending-pair.' },
  { id: 'risklayer',      name: 'RiskLayer',       type: 'Rating',     focus: 'Proof-of-Risk consensus on EigenLayer',
    methodology: 'AI-pipeline (discovery → contract → governance → audit → scoring) + Monte Carlo. Validator-attested risk scores 0–100, settled on EigenLayer.' },
  { id: 'pigi',           name: 'pigi.finance',    type: 'Dashboard',  focus: '50+ protocol vault analytics, risk-adjusted yield',
    methodology: 'Historical exploits, holder concentration, risk-adjusted APY per vault.' },
  { id: 'xerberus',       name: 'Xerberus',        type: 'Rating',     focus: '300+ subscores across 85+ mechanisms',
    methodology: 'Investor-focused open-source vault rating. Decomposes risk into mechanism-level subscores.' },
  { id: 'zyfai',          name: 'Zyfai Risk',      type: 'Dashboard',  focus: 'Real-time pool-level risk scores',
    methodology: 'Risk metrics, TVL, APY, security grades across liquidity pools.' },
  { id: 'llamarisk',      name: 'LlamaRisk',       type: 'Research',   focus: 'Protocol risk research + parameter recommendations',
    methodology: 'Long-form research; collateral and governance risk; parameter proposals to DAOs (Curve, Sky).' },
  { id: 'philidor',       name: 'Philidor',        type: 'Rating',     focus: 'Deterministic vault scoring, 700+ vaults',
    methodology: 'Three-vector framework — asset quality, platform code maturity, governance controls. Open methodology.' },
  { id: 'stablewatch',    name: 'Stablewatch',     type: 'Dashboard',  focus: 'Yield-bearing stablecoin landscape (60+ assets)',
    methodology: 'Real-time APY, TVL, yield paid out. Category framework (blue-chip vs hidden-gem) with qualitative per-category risk vectors.' },
];

// Canonical protocol list: RFP §3 seed-20 plus three top-TVL incumbents (sky, ethena, etherfi)
// that the RFP didn't enumerate but DefiLlama still ranks in the real top-20 by funds at risk.
// tvl_usd left as-is until the DefiLlama adapter lands; new entries without numbers are null.
// inlineRating: { defiscan: ... } was removed — matrix Stage cells now read from public/data/feeds/defiscan.json.
// logoUrl is the canonical DefiLlama protocol-icon URL (extension varies — png/jpg —
// so we store the full URL instead of computing it). Avatar falls back to initials on
// any image error so a broken URL never produces a broken-image placeholder.
const L = (slug, ext) => `https://icons.llamao.fi/icons/protocols/${slug}.${ext}`;
export const PROTOCOLS = [
  { slug: 'lido',          name: 'Lido',           category: 'Liquid Staking',   tvl_usd: 14940071550, family: 'Lido',              twitter: 'LidoFinance',      governance_summary: '5/7 · 3d', logoUrl: L('lido', 'png') },
  { slug: 'aave',          name: 'Aave',           category: 'Lending',          tvl_usd: 10130542675, family: 'Aave',              versions: ['v3','v4'],         twitter: 'aave',           governance_summary: '5/9 · 2d', ontologyDir: 'aave-v3', logoUrl: L('aave-v3', 'png') },
  { slug: 'spark',         name: 'Spark',          category: 'Lending',          tvl_usd:  7100000000, family: 'Sky',                                            twitter: 'sparkdotfi',       governance_summary: '2d', logoUrl: L('sparklend', 'jpg') },
  { slug: 'sky',           name: 'Sky (MakerDAO)', category: 'CDP / Stablecoin', tvl_usd:  6042932584, family: 'Sky',                                            twitter: 'SkyEcosystem',     governance_summary: '2d', logoUrl: L('sky-lending', 'jpg') },
  { slug: 'ethena',        name: 'Ethena',         category: 'Synthetic Yield',  tvl_usd:  4837397870, family: 'Ethena',                                         twitter: 'ethena',           governance_summary: '—', logoUrl: L('ethena-usde', 'png') },
  { slug: 'morpho',        name: 'Morpho',         category: 'Lending',          tvl_usd:  3476196272, family: 'Morpho',            versions: ['v1','v2'],         twitter: 'MorphoLabs',     governance_summary: '5/9 · 7d', logoUrl: L('morpho-blue', 'png') },
  { slug: 'etherfi',       name: 'ether.fi',       category: 'Liquid Restaking', tvl_usd:  2970000000, family: 'ether.fi',                                       twitter: 'ether_fi',         governance_summary: '—', logoUrl: L('ether.fi', 'jpg') },
  { slug: 'uniswap',       name: 'Uniswap',        category: 'DEX / AMM',        tvl_usd:  1910000000, family: 'Uniswap',           versions: ['v3','v4','UniswapX'], twitter: 'Uniswap',     governance_summary: '2d', logoUrl: L('uniswap-v3', 'png') },
  { slug: 'curve',         name: 'Curve',          category: 'DEX / AMM',        tvl_usd:  1430000000, family: 'Curve',                                          twitter: 'CurveFinance',     governance_summary: '4/6 · 3d', logoUrl: L('curve', 'png') },
  { slug: 'compound',      name: 'Compound',       category: 'Lending',          tvl_usd:  1050000000, family: 'Compound',          versions: ['v2','v3'],         twitter: 'compoundfinance',governance_summary: '2d', logoUrl: L('compound-v3', 'png') },
  { slug: 'rocketpool',    name: 'Rocket Pool',    category: 'Liquid Staking',   tvl_usd:   900000000, family: 'Rocket Pool',                                    twitter: 'Rocket_Pool',      governance_summary: '—', logoUrl: L('rocket-pool', 'jpg') },
  { slug: 'pendle',        name: 'Pendle',         category: 'Yield / Vault',    tvl_usd:   800000000, family: 'Pendle',                                         twitter: 'pendle_fi',        governance_summary: '—', logoUrl: L('pendle', 'jpg') },
  { slug: 'fluid',         name: 'Fluid',          category: 'Lending',          tvl_usd:   580000000, family: 'Fluid (Instadapp)',                              twitter: '0xfluid',          governance_summary: '—', logoUrl: L('fluid-lending', 'png') },
  { slug: 'liquity',       name: 'Liquity',        category: 'Lending / CDP',    tvl_usd:   200000000, family: 'Liquity',           versions: ['v1','v2'],         twitter: 'LiquityProtocol',governance_summary: '—', logoUrl: L('liquity-v2', 'jpg') },
  { slug: 'yearn',         name: 'Yearn',          category: 'Yield / Vault',    tvl_usd:   160000000, family: 'Yearn',                                          twitter: 'yearnfi',          governance_summary: '—', logoUrl: L('yearn-finance', 'jpg') },
  { slug: 'euler',         name: 'Euler',          category: 'Lending',          tvl_usd:   140000000, family: 'Euler',             versions: ['v1','v2'],         twitter: 'eulerfinance',   governance_summary: '—', logoUrl: L('euler-v2', 'png') },
  { slug: 'mellow',        name: 'Mellow',         category: 'Yield / Vault',    tvl_usd:   120000000, family: 'Mellow',                                         twitter: 'mellowprotocol',   governance_summary: '—', logoUrl: L('mellow-core', 'jpg') },
  { slug: 'morpho-vaults', name: 'Morpho Vaults',  category: 'Yield / Vault',    tvl_usd:          null, family: 'Morpho',                                       twitter: 'MorphoLabs',       governance_summary: '—', logoUrl: L('morpho-blue', 'png') },
  { slug: 'balancer',      name: 'Balancer',       category: 'DEX / AMM',        tvl_usd:    90000000, family: 'Balancer',          versions: ['v2','v3','CoW AMM'], twitter: 'Balancer',     governance_summary: '—', logoUrl: L('balancer-v3', 'jpg') },
  { slug: 'gearbox',       name: 'Gearbox',        category: 'Lending',          tvl_usd:    14000000, family: 'Gearbox',                                        twitter: 'GearboxProtocol',governance_summary: '—', logoUrl: L('gearbox', 'jpg') },
  { slug: 'cowswap',       name: 'CoW Swap',       category: 'Swap Aggregator',  tvl_usd:           0, family: 'CoW',                                            twitter: 'CoWSwap',          volume_usd_24h: 280000000, governance_summary: '—', logoUrl: L('cowswap', 'jpg') },
  { slug: '1inch',         name: '1inch',          category: 'Swap Aggregator',  tvl_usd:          null, family: '1inch',                                        twitter: '1inch',            governance_summary: '—', logoUrl: L('1inch', 'jpg') },
  { slug: '0x',            name: '0x / Matcha',    category: 'Swap Aggregator',  tvl_usd:          null, family: '0x',                                           twitter: '0xProject',        governance_summary: '—', logoUrl: L('matcha', 'jpg') },
];

export const slugToOntologyDir = (slug) => {
  const p = PROTOCOLS.find(x => x.slug === slug);
  return p?.ontologyDir || slug;
};
