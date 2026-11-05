import Tooltip from '../Tooltip'

const CAPS = [
  { id: 'create', label: 'Create link' },
  { id: 'read', label: 'Read state' },
  { id: 'fund', label: 'Fund' },
  { id: 'claim', label: 'Claim' },
  { id: 'refund', label: 'Refund' },
]

const MODES = [
  {
    id: 'demo',
    label: 'Demo',
    cells: {
      create: 'ready',
      read: 'ready',
      fund: 'sim',
      claim: 'sim',
      refund: 'ready',
    },
  },
  {
    id: 'sepolia',
    label: 'Sepolia public',
    cells: {
      create: 'ready',
      read: 'ready',
      fund: 'ready',
      claim: 'ready',
      refund: 'partial',
    },
  },
  {
    id: 'wallet',
    label: 'Wallet API',
    cells: {
      create: 'ready',
      read: 'ready',
      fund: 'partial',
      claim: 'partial',
      refund: 'partial',
    },
  },
]

const TIP = {
  ready: 'Works in this mode today.',
  sim: 'Simulated in the local demo ledger only.',
  partial:
    'UI wired; needs a STRK20 privacy wallet (private fund / claim-to-note / refund-to-note). Public Sepolia refund is Wallet-API gated in the SDK.',
  next: 'Planned. Not wired in this UI yet.',
}

/** G3 — capability matrix heatmap. */
export default function CapabilityMatrix() {
  return (
    <figure className="chart-figure matrix-figure">
      <figcaption className="chart-cap">
        <span>Capability matrix</span>
        <span className="chart-sub">
          <Tooltip
            title="How to read"
            body="Filled = ready. Hatch = partial. Empty = not yet. Hover cells for truth."
          >
            Legend
          </Tooltip>
        </span>
      </figcaption>
      <div className="matrix" role="table" aria-label="Capability matrix by mode">
        <div className="matrix-row head" role="row">
          <div className="matrix-cell label" role="columnheader">
            Mode
          </div>
          {CAPS.map((c) => (
            <div key={c.id} className="matrix-cell label" role="columnheader">
              {c.label}
            </div>
          ))}
        </div>
        {MODES.map((m) => (
          <div key={m.id} className="matrix-row" role="row">
            <div className="matrix-cell label" role="rowheader">
              {m.label}
            </div>
            {CAPS.map((c) => {
              const state = m.cells[c.id]
              return (
                <div key={c.id} className="matrix-cell" role="cell">
                  <Tooltip title={`${m.label} · ${c.label}`} body={TIP[state]} compact hideMark>
                    <span className={`swatch ${state}`} aria-label={state} />
                  </Tooltip>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </figure>
  )
}
