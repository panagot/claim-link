import { useMemo } from 'react'
import Tooltip from '../Tooltip'

const COLORS = {
  open: 'var(--signal)',
  claimed: 'var(--accent)',
  expired: 'var(--muted)',
  refunded: 'var(--ink-soft)',
}

/** G5 — demo ledger composition. */
export default function DonutChart({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const segments = useMemo(() => {
    if (!total) return []
    let angle = -Math.PI / 2
    const cx = 60
    const cy = 60
    const r = 42
    const r0 = 26
    return Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([key, n]) => {
        const sweep = (n / total) * Math.PI * 2
        const a0 = angle
        const a1 = angle + sweep
        angle = a1
        const large = sweep > Math.PI ? 1 : 0
        const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)]
        const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)]
        const q0 = [cx + r0 * Math.cos(a1), cy + r0 * Math.sin(a1)]
        const q1 = [cx + r0 * Math.cos(a0), cy + r0 * Math.sin(a0)]
        const d = `M${p0[0]},${p0[1]} A${r},${r} 0 ${large} 1 ${p1[0]},${p1[1]} L${q0[0]},${q0[1]} A${r0},${r0} 0 ${large} 0 ${q1[0]},${q1[1]} Z`
        return { key, n, d }
      })
  }, [counts, total])

  if (!total) {
    return (
      <figure className="chart-figure donut-empty">
        <figcaption className="chart-cap">
          <span>Ledger composition</span>
        </figcaption>
        <p className="empty">No envelopes yet. Create one to populate this chart.</p>
      </figure>
    )
  }

  return (
    <figure className="chart-figure donut-figure">
      <figcaption className="chart-cap">
        <span>Ledger composition</span>
        <span className="chart-sub">{total} envelopes</span>
      </figcaption>
      <div className="donut-row">
        <svg viewBox="0 0 120 120" className="donut-svg draw" role="img" aria-label="Envelope status composition">
          {segments.map((s) => (
            <path key={s.key} d={s.d} fill={COLORS[s.key] || 'var(--muted)'} />
          ))}
          <text x="60" y="58" textAnchor="middle" className="donut-total">
            {total}
          </text>
          <text x="60" y="74" textAnchor="middle" className="donut-label">
            total
          </text>
        </svg>
        <ul className="donut-legend">
          {Object.entries(counts).map(([key, n]) => (
            <li key={key}>
              <Tooltip title={key} body={`${n} envelope(s) currently ${key} in the demo ledger.`}>
                <span className="leg-swatch" style={{ background: COLORS[key] }} />
                {key}
              </Tooltip>
              <strong>{n}</strong>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}
