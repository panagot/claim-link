import Tooltip from '../Tooltip'

/** G6 — roadmap proportional bar. Width lives on flex children (not nested tip wrappers). */
export default function ProgressMeter({ segments }) {
  const total = segments.reduce((s, x) => s + x.weight, 0) || 1
  return (
    <figure className="chart-figure">
      <figcaption className="chart-cap">
        <span>Seed path progress</span>
        <span className="chart-sub">Weighted phases</span>
      </figcaption>
      <div className="progress-meter" role="img" aria-label="Roadmap progress">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className={`progress-seg ${seg.tone}`}
            style={{ flex: `${seg.weight} 1 0%`, width: `${(seg.weight / total) * 100}%` }}
          >
            <Tooltip title={seg.label} body={seg.tip} wide hideMark>
              <em>{seg.label}</em>
            </Tooltip>
          </div>
        ))}
      </div>
    </figure>
  )
}
