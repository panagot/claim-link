import { useState } from 'react'

const STEPS = [
  {
    id: 'seal',
    n: '01',
    title: 'Seal',
    body: 'Fund publicly from any Starknet wallet, or privately through the pool when a STRK20 Wallet API is present. A destination-bound key is generated.',
    figure: 'Funder wallet → anonymizer. Amount is committed on-chain against a public key, not a reusable secret.',
  },
  {
    id: 'share',
    n: '02',
    title: 'Share',
    body: 'Hand over the bearer link like cash. The claim key lives in the URL fragment and never touches a server.',
    figure: 'Bearer fragment #/claim/… travels off-chain. No backend, no account required to receive it.',
  },
  {
    id: 'claim',
    n: '03',
    title: 'Claim',
    body: 'The recipient claims to any Starknet address with no viewing key, or into a private note later once registered. Unclaimed value is refundable after expiry.',
    figure: 'claim_to_address (public) today, claim-to-note (private) when a Wallet API is present. Signature is welded to one destination.',
  },
]

/** Interactive Seal → Share → Claim explainer. */
export default function FlowSteps() {
  const [active, setActive] = useState('seal')
  const current = STEPS.find((s) => s.id === active) || STEPS[0]

  return (
    <div className="flow-steps">
      <ol className="flow-steps-list" role="tablist" aria-label="How Claimlink works">
        {STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              role="tab"
              aria-selected={active === s.id}
              className={`flow-step ${active === s.id ? 'active' : ''}`}
              onMouseEnter={() => setActive(s.id)}
              onFocus={() => setActive(s.id)}
              onClick={() => setActive(s.id)}
            >
              <span className="flow-step-n">{s.n}</span>
              <span className="flow-step-title">{s.title}</span>
              <span className="flow-step-body">{s.body}</span>
            </button>
          </li>
        ))}
      </ol>
      <aside className="flow-figure-panel" aria-live="polite">
        <span className="flow-figure-step">
          {current.n} · {current.title}
        </span>
        <p>{current.figure}</p>
        <div className="flow-figure-rail" aria-hidden="true">
          {STEPS.map((s) => (
            <span key={s.id} className={`rail-dot ${active === s.id ? 'on' : ''}`} />
          ))}
        </div>
      </aside>
    </div>
  )
}
