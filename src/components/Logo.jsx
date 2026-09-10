import React from 'react';

// Inline SVG logo so it can be styled/sized via CSS and reused anywhere
// (Navbar, Footer, admin header, etc). Mirrors /public/logo.svg.
const Logo = ({ width = 170, height = 70, className = '' }) => {
  const gradId = React.useId ? React.useId().replace(/:/g, '') : 'logoGrad';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 140"
      width={width}
      height={height}
      className={`ui-logo ${className}`}
      role="img"
      aria-label="UI Fragrance"
    >
      <defs>
        <linearGradient id={`goldGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d78c" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>

      <g transform="translate(170, 18)">
        <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill={`url(#goldGrad-${gradId})`} />
      </g>

      <line x1="70" y1="38" x2="270" y2="38" stroke={`url(#goldGrad-${gradId})`} strokeWidth="1" opacity="0.8" />

      <text
        x="170"
        y="92"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="700"
        fontSize="58"
        fill={`url(#goldGrad-${gradId})`}
        letterSpacing="4"
      >
        UI
      </text>

      <text
        x="170"
        y="114"
        textAnchor="middle"
        fontFamily="'Poppins', Arial, sans-serif"
        fontWeight="500"
        fontSize="15"
        fill="#ffffff"
        letterSpacing="7"
      >
        FRAGRANCE
      </text>

      <line x1="70" y1="126" x2="270" y2="126" stroke={`url(#goldGrad-${gradId})`} strokeWidth="1" opacity="0.8" />
    </svg>
  );
};

export default Logo;