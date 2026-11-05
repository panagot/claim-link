import Tooltip from '../Tooltip'

const RISKS = [
  {
    id: 'bearer',
    label: 'Bearer link',
    level: 80,
    rank: 'High',
    tip: 'Anyone with the fragment can claim. Operational risk, not a crypto bug.',
  },
  {
    id: 'frontrun',
    label: 'Front-run (ref helper)',
    level: 70,
    rank: 'Medium',
    tip: 'Reference secret-preimage claims are front-runnable. Destination-bound auth reduces this.',
  },
  {
    id: 'keyloss',
    label: 'Refund / key loss',
    level: 85,
    rank: 'High',
    tip: 'Lose the refund link and expiry recovery is hard. Public-path refund-to-note still needs a STRK20 Wallet API.',
  },
  {
    id: 'audit',
    label: 'Audit gap',
    level: 90,
    rank: 'High',
    tip: 'This UI and path are not audited. Do not move mainnet size funds here yet.',
  },
]

/** Qualitative risk bars (assessment, not audit scores). */
export default function RiskBars() {
  return (
    <figure className="chart-figure">
      <figcaption className="chart-cap">
        <span>Risk attention</span>
        <span className="chart-sub">
          <Tooltip
            title="Qualitative"
            body="Internal assessment for reviewers. Not an audit score or quantitative model."
          >
            Assessment only
          </Tooltip>
        </span>
      </figcaption>
      <ul className="risk-bars">
        {RISKS.map((r) => (
          <li key={r.id}>
            <div className="risk-label">
              <Tooltip title={r.label} body={r.tip}>
                {r.label}
              </Tooltip>
              <span>{r.rank}</span>
            </div>
            <div className="risk-track">
              <span className="risk-fill" style={{ width: `${r.level}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  )
}
