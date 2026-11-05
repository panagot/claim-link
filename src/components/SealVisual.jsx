/** Dominant hero visual: seal → fragment → claim. */

export default function SealVisual() {
  return (
    <div className="seal-visual" aria-hidden="true">
      <svg viewBox="0 0 520 420" role="presentation" className="seal-svg">
        <defs>
          <linearGradient id="sealFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16163a" />
            <stop offset="100%" stopColor="#0e0e28" />
          </linearGradient>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#26264d" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="8" y="8" width="504" height="404" fill="url(#sealFill)" stroke="#34345e" strokeWidth="1.5" />
        <rect x="8" y="8" width="504" height="404" fill="url(#grid)" opacity="0.5" />

        <g className="seal-draw seal-a">
          <rect x="48" y="64" width="150" height="110" fill="#1c1c42" stroke="#34345e" strokeWidth="1.5" />
          <text x="64" y="96" className="svg-label">
            FUND
          </text>
          <text x="64" y="126" className="svg-body">
            public wallet
          </text>
          <text x="64" y="148" className="svg-body">
            into anonymizer
          </text>
        </g>

        <path
          className="seal-draw seal-path"
          d="M198 119 H250"
          fill="none"
          stroke="#ec796b"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        <g className="seal-draw seal-b">
          <rect x="250" y="48" width="220" height="142" fill="#0c0c4f" stroke="#ec796b" strokeWidth="1.5" />
          <text x="270" y="84" className="svg-label on-dark">
            BEARER LINK
          </text>
          <text x="270" y="118" className="svg-mono on-dark">
            #/claim/…
          </text>
          <text x="270" y="148" className="svg-body on-dark soft">
            fragment never hits server
          </text>
        </g>

        <path
          className="seal-draw seal-path delay"
          d="M360 190 V230"
          fill="none"
          stroke="#ec796b"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        <g className="seal-draw seal-c">
          <rect x="250" y="230" width="220" height="120" fill="#1c1c42" stroke="#34345e" strokeWidth="1.5" />
          <text x="270" y="268" className="svg-label">
            CLAIM
          </text>
          <text x="270" y="298" className="svg-body">
            claim_to_address
          </text>
          <text x="270" y="320" className="svg-body">
            (note optional later)
          </text>
        </g>

        <g className="seal-draw seal-d">
          <rect x="48" y="230" width="150" height="120" fill="#1c1c42" stroke="#4fd1c5" strokeWidth="1.5" />
          <text x="64" y="268" className="svg-label signal">
            STATUS
          </text>
          <text x="64" y="298" className="svg-body">
            open · claimed
          </text>
          <text x="64" y="320" className="svg-body">
            expired · refund
          </text>
        </g>
      </svg>
    </div>
  )
}
