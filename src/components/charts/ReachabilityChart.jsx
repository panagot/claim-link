import { useMemo, useState } from 'react'

/** G2 — pool / anonymizer up-down over probe history. */
export default function ReachabilityChart({ points = [], height = 120 }) {
  const [hover, setHover] = useState(null)
  const w = 560
  const pad = { t: 20, r: 12, b: 24, l: 88 }
  const innerW = w - pad.l - pad.r

  const lanes = useMemo(() => {
    if (!points.length) return { pool: '', anon: '', coords: [] }
    const n = Math.max(points.length - 1, 1)
    const yPool = { up: pad.t + 18, down: pad.t + 36 }
    const yAnon = { up: pad.t + 62, down: pad.t + 80 }
    const coords = points.map((p, i) => ({
      ...p,
      x: pad.l + (i / n) * innerW,
      i,
    }))
    const step = (key, yMap) =>
      coords
        .map((c, i) => {
          const y = c[key] ? yMap.up : yMap.down
          return `${i === 0 ? 'M' : 'L'}${c.x},${y}`
        })
        .join(' ')
    return {
      pool: step('poolOk', yPool),
      anon: step('anonymizerOk', yAnon),
      coords,
      yPool,
      yAnon,
    }
  }, [points, innerW, pad.l, pad.t])

  return (
    <figure className="chart-figure">
      <figcaption className="chart-cap">
        <span>Contract reachability</span>
        <span className="chart-sub">Class-hash probes over session</span>
      </figcaption>
      <svg
        className="chart-svg draw"
        viewBox={`0 0 ${w} ${height}`}
        role="img"
        aria-label="Pool and anonymizer reachability over time"
        onMouseLeave={() => setHover(null)}
      >
        <text x={8} y={lanes.yPool?.up ?? 30} className="chart-axis">
          Pool
        </text>
        <text x={8} y={lanes.yAnon?.up ?? 74} className="chart-axis">
          Anonymizer
        </text>
        {lanes.pool ? <path d={lanes.pool} className="chart-line ink" fill="none" /> : null}
        {lanes.anon ? <path d={lanes.anon} className="chart-line accent" fill="none" /> : null}
        {lanes.coords?.map((c) => (
          <rect
            key={c.ts || c.i}
            x={c.x - 6}
            y={pad.t}
            width="12"
            height={height - pad.t - pad.b}
            fill="transparent"
            onMouseEnter={() => setHover(c)}
          />
        ))}
        {!points.length ? (
          <text x={w / 2} y={height / 2} textAnchor="middle" className="chart-empty">
            No history yet
          </text>
        ) : null}
      </svg>
      {hover ? (
        <div className="chart-hover">
          <span>{new Date(hover.ts).toLocaleTimeString()}</span>
          <span>Pool {hover.poolOk ? 'up' : 'down'}</span>
          <span>Anonymizer {hover.anonymizerOk ? 'up' : 'down'}</span>
        </div>
      ) : (
        <p className="chart-a11y muted">Step chart: up = probe ok, down = probe failed.</p>
      )}
    </figure>
  )
}
