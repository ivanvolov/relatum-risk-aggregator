import { useState } from 'react';
import { initials } from '../lib/format.js';

// Renders the protocol brand logo. Falls back to a text-initials circle on image error
// (404 / network) so the matrix still renders cleanly when a URL is wrong or missing.
// `size` is 'sm' (matrix avatar) or 'lg' (detail header).
export default function Avatar({ name, logoUrl, size = 'sm' }) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === 'lg' ? 'avatar-lg' : 'avatar';
  if (!logoUrl || failed) {
    return <span className={sizeClass}>{initials(name)}</span>;
  }
  return (
    <img
      className={`${sizeClass} avatar-img`}
      src={logoUrl}
      alt={name}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
