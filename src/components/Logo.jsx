/**
 * Claimlink mark: two interlocking links (claim + bearer link) sealed at the cross.
 * Coral gradient accent on a navy vault tile. Crisp from 24px up.
 */
export default function Logo({ size = 36, className = '' }) {
  const s = size
  return (
    <svg
      className={`logo-mark ${className}`}
      width={s}
      height={s}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Claimlink"
    >
      <defs>
        <linearGradient id="clTile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a3d" />
          <stop offset="100%" stopColor="#0c0c2e" />
        </linearGradient>
        <linearGradient id="clCoral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9179" />
          <stop offset="55%" stopColor="#ec796b" />
          <stop offset="100%" stopColor="#d9556f" />
        </linearGradient>
      </defs>

      {/* Vault tile */}
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="16"
        fill="url(#clTile)"
        stroke="#ec796b"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />

      {/* Interlocking links, rotated to read as a chain */}
      <g transform="rotate(-38 32 32)" fill="none" strokeWidth="5" strokeLinecap="round">
        {/* claim link */}
        <rect x="12" y="24" width="26" height="16" rx="8" stroke="#cdd0ef" />
        {/* bearer link */}
        <rect x="26" y="24" width="26" height="16" rx="8" stroke="url(#clCoral)" />
      </g>

      {/* Seal node at the cross */}
      <circle cx="32" cy="32" r="4.4" fill="#0c0c2e" />
      <circle cx="32" cy="32" r="2.6" fill="url(#clCoral)" />
    </svg>
  )
}
