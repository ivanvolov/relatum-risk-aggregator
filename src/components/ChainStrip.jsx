import { useState } from 'react';

// DefiLlama chain-icon CDN. Same convention as protocol icons.
const ICON_BASE = 'https://icons.llamao.fi/icons/chains/rsz_';

// Natural slug works for 76 of 77 chains we see. Only xDai needs renaming
// (DefiLlama hosts the icon under `gnosis`). Add to this map if you spot
// another chain that 404s — fallback is a text chip so nothing breaks.
const SLUG_OVERRIDES = {
  'xDai': 'gnosis',
};

// Numeric EVM chain ID → DefiLlama chain name. Used when an adapter emits
// chain IDs in a claim value (e.g. zyfai: "1, 8453, 42161").
const CHAIN_ID_TO_NAME = {
  1: 'Ethereum',
  10: 'Optimism',
  56: 'BSC',
  100: 'xDai',
  130: 'Unichain',
  137: 'Polygon',
  146: 'Sonic',
  324: 'zkSync Era',
  480: 'World Chain',
  999: 'Hyperliquid L1',
  1135: 'Lisk',
  5000: 'Mantle',
  8453: 'Base',
  42161: 'Arbitrum',
  43114: 'Avalanche',
  59144: 'Linea',
  81457: 'Blast',
  534352: 'Scroll',
};

// Resolve a single token (chain name string or numeric chain ID) to a display
// name. Returns null if we can't recognize the token (e.g. "1.000" from a
// non-chain claim) — caller treats null as "skip rendering".
export function resolveChainName(token) {
  const t = String(token).trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    return CHAIN_ID_TO_NAME[n] || `chain ${n}`;
  }
  return t;
}

function chainSlug(name) {
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name];
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// One icon. Falls back to a small text chip if the image fails to load.
function ChainIcon({ name }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <span className="chain-chip" title={name}>{name.slice(0, 4)}</span>;
  }
  return (
    <img
      className="chain-icon"
      src={ICON_BASE + chainSlug(name) + '.jpg'}
      alt={name}
      title={name}
      width={16}
      height={16}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

// Renders a strip of chain icons. Caps at `max` (default 12) and shows `+N`
// chip that, when clicked, expands the full list.
export default function ChainStrip({ chains, max = 12 }) {
  const [expanded, setExpanded] = useState(false);
  if (!chains || !chains.length) return <span className="chain-strip dim">—</span>;

  const visible = expanded || chains.length <= max ? chains : chains.slice(0, max);
  const overflow = chains.length - visible.length;

  return (
    <span className="chain-strip">
      {visible.map((c) => <ChainIcon key={c} name={c} />)}
      {overflow > 0 ? (
        <button
          type="button"
          className="chain-more"
          onClick={() => setExpanded(true)}
          title={chains.slice(max).join(', ')}
        >
          +{overflow}
        </button>
      ) : null}
    </span>
  );
}
