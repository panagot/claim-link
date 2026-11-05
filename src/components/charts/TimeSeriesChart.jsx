import { useMemo, useState } from 'react'

/** G1 — probe latency series (SVG). */
export default function TimeSeriesChart({ points = [], height = 160 }) {
  const [hover, setHover] = useState(null)
  const w = 560
  const pad = { t: 16, r: 12, b: 28, l: 40 }
  const innerW = w - pad.l - pad.r
  const innerH = height - pad.t - pad.b

  const { path, area, dots, maxMs, summary } = useMemo(() => {
    const valid = points.filter((p) => p.ms != null)
    if (!valid.length) {
      return { path: '', area: '', dots: [], maxMs: 0, summary: 'No probe samples yet. Refresh Status.' }
    }
    const maxMs = Math.max(50, ...valid.map((p) => p.ms))
    const n = Math.max(points.length - 1, 1)
    const coords = points.map((p, i) => {
      const x = pad.l + (i / n) * innerW
      const y =
        p.ms == null ? null : pad.t + innerH - (Math.min(p.ms, maxMs) / maxMs) * innerH
      return { ...p, x, y, i }
    })
    const drawn = coords.filter((c) => c.y != null)
    const path = drawn.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ')
    const area =
      drawn.length > 1
        ? `${path} L${drawn[drawn.length - 1].x},${pad.t + innerH} L${drawn[0].x},${pad.t + innerH} Z`
        : ''
    const avg = Math.round(valid.reduce((s, p) => s + p.ms, 0) / valid.length)
    return {
      path,
      area,
      dots: coords,
      maxMs,
      summary: `${valid.length} samples, avg ${avg} ms, max ${Math.max(...valid.map((p) => p.ms))} ms`,
    }
  }, [points, innerW, innerH, pad.l, pad.t])

  return (
    <figure className="chart-figure">
      <figcaption className="chart-cap">
        <span>Probe latency</span>
        <span className="chart-sub">Session history (ms)</span>
      </figcaption>
      <svg
        className="chart-svg draw"
        viewBox={`0 0 ${w} ${height}`}
        role="img"
        aria-label={summary}
        onMouseLeave={() => setHover(null)}
      >
        <title>Sepolia probe latency</title>
        <desc>{summary}</desc>
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + innerH * (1 - t)
          return (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} className="chart-grid" />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" className="chart-axis">
                {Math.round(maxMs * t)}
              </text>
            </g>
          )
        })}
        {area ? <path d={area} className="chart-area" /> : null}
        {path ? <path d={path} className="chart-line signal" fill="none" /> : null}
        {dots.map((d) =>
          d.y == null ? null : (
            <circle
              key={d.ts || d.i}
              cx={d.x}
              cy={d.y}
              r={hover?.i === d.i ? 4.5 : 3}
              className={d.ok ? 'chart-dot signal' : 'chart-dot danger'}
              onMouseEnter={() => setHover(d)}
            />
          ),
        )}
        {!points.length ? (
          <text x={w / 2} y={height / 2} textAnchor="middle" className="chart-empty">
            Refresh probes to start the series
          </text>
        ) : null}
      </svg>
      {hover ? (
        <div className="chart-hover">
          <strong>{hover.ms} ms</strong>
          <span>{new Date(hover.ts).toLocaleTimeString()}</span>
          <span>block {hover.blockNumber ?? '—'}</span>
          <span>{hover.ok ? 'reachable' : 'issue'}</span>
        </div>
      ) : (
        <p className="chart-a11y muted">{summary}</p>
      )}
    </figure>
  )
}
