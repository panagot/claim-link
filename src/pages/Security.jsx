import { useState } from 'react'
import RiskBars from '../components/charts/RiskBars'
import Tooltip from '../components/Tooltip'
import { randomId } from '../lib/crypto'
import * as ledger from '../lib/ledger'
import {
  SECURITY_CASES,
  runDoubleClaimCheck,
  runExpiryCheck,
  runRetargetCheck,
} from '../lib/securityChecks'

const THREATS = [
  {
    threat: 'Claim front-running',
    vector: 'A searcher copies a claim signature from the mempool and submits it first.',
    mitigation: 'Authorization is bound to one destination address; a copied signature will not verify for another recipient.',
    status: 'mitigated',
  },
  {
    threat: 'Double claim',
    vector: 'A holder attempts to claim an already-claimed envelope twice.',
    mitigation: 'Once status is claimed, the ledger and the on-chain anonymizer refuse further claims.',
    status: 'mitigated',
  },
  {
    threat: 'Link / key leakage',
    vector: 'The claim key ends up in a server log, query string, or shared channel.',
    mitigation: 'Keys live only in the URL fragment, which browsers never transmit. No backend receives it.',
    status: 'mitigated',
  },
  {
    threat: 'Stuck funds',
    vector: 'Nobody ever claims the envelope.',
    mitigation: 'Value is refundable after expiry via the refund link. Public-path expiry refund uses refund-to-note through a STRK20 wallet today.',
    status: 'partial',
  },
  {
    threat: 'Funder de-anonymization',
    vector: 'An observer links the funder to the payment.',
    mitigation: 'Public fund reveals the funder by design. Funder privacy requires the optional STRK20 private-pool path.',
    status: 'by-design',
  },
  {
    threat: 'Contract / UI compromise at scale',
    vector: 'Mainnet-size funds routed through an unaudited prototype.',
    mitigation: 'Out of Seed scope. Sepolia demos only; formal review precedes any mainnet recommendation.',
    status: 'out-of-scope',
  },
]

const ASSETS = [
  { a: 'Claim key', loc: 'URL fragment only', trust: 'Held by the recipient. Never sent to any server.' },
  { a: 'Refund key', loc: 'Backup JSON / refund link', trust: 'Held offline by the funder. Recovery handle after expiry.' },
  { a: 'Escrowed value', loc: 'On-chain anonymizer (Sepolia)', trust: 'Governed by the STRK20 pool + Envelope release logic.' },
  { a: 'Demo ledger', loc: 'Browser localStorage', trust: 'Isolated, non-chain. For UX walkthroughs only.' },
]

const STATUS_LABEL = {
  mitigated: 'Mitigated',
  partial: 'Partial',
  'by-design': 'By design',
  'out-of-scope': 'Out of scope',
}

export default function Security() {
  const [results, setResults] = useState({})
  const [running, setRunning] = useState(false)

  const runAll = async () => {
    setRunning(true)
    const next = {}
    for (const c of SECURITY_CASES) {
      if (c.static) {
        next[c.id] = { pass: c.pass, detail: c.detail, at: Date.now() }
        setResults({ ...next })
        continue
      }
      try {
        let out
        if (c.id === 'retarget') out = await runRetargetCheck()
        else if (c.id === 'double') out = await runDoubleClaimCheck(ledger, randomId)
        else if (c.id === 'expiry') out = await runExpiryCheck(ledger, randomId)
        else out = { pass: false, detail: 'Unknown case' }
        next[c.id] = { ...out, at: Date.now() }
      } catch (e) {
        next[c.id] = { pass: false, detail: e.message || String(e), at: Date.now() }
      }
      setResults({ ...next })
    }
    setRunning(false)
  }

  return (
    <main className="page docs">
      <header className="page-head">
        <div>
          <p className="eyebrow">Security dossier</p>
          <h1>Threat model &amp; recorded checks</h1>
          <p className="page-lede">
            What Claimlink protects, what it does not, and in-browser demo checks. These are not on-chain
            anonymizer tests and not an audit. Do not move mainnet-size funds here.
          </p>
        </div>
      </header>

      <RiskBars />

      <section className="panel" style={{ marginTop: '1.5rem' }}>
        <h2>Threat model</h2>
        <p className="muted">
          Each row is a concrete attacker goal, the vector, and how Claimlink answers it. Status is honest about
          what is only partial or deliberately out of scope.
        </p>
        <table className="threat-table">
          <thead>
            <tr>
              <th>Threat</th>
              <th>Vector</th>
              <th>Mitigation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {THREATS.map((t) => (
              <tr key={t.threat}>
                <td className="t-name">{t.threat}</td>
                <td>{t.vector}</td>
                <td>{t.mitigation}</td>
                <td>
                  <span className={`sev sev-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Assets &amp; trust boundaries</h2>
        <p className="muted">What is worth protecting, where it lives, and who is trusted with it.</p>
        <div className="asset-grid">
          {ASSETS.map((x) => (
            <article key={x.a} className="asset-card">
              <h3>{x.a}</h3>
              <p className="asset-loc">{x.loc}</p>
              <p>{x.trust}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head row">
          <div>
            <h2>Recorded failure cases (demo)</h2>
            <p>
              Local crypto + demo ledger only. On-chain authorization follows Envelope destination-bound
              release messages — verify via a Sepolia claim round-trip, not this button alone.
            </p>
          </div>
          <button type="button" className="btn primary" disabled={running} onClick={runAll}>
            {running ? 'Running…' : 'Run security checks'}
          </button>
        </div>
        <ul className="security-cases">
          {SECURITY_CASES.map((c) => {
            const r = results[c.id]
            return (
              <li key={c.id}>
                <div className="case-top">
                  <strong>{c.title}</strong>
                  {r ? (
                    <span className={`pill ${r.pass ? 'funded' : 'expired'}`}>
                      {r.pass ? 'pass' : 'fail'}
                    </span>
                  ) : (
                    <span className="pill open">not run</span>
                  )}
                </div>
                <p>{c.body}</p>
                {r ? <p className="muted mono-detail">{r.detail}</p> : null}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="panel">
        <h2>Public checklist</h2>
        <ul className="check-list">
          <li>
            <strong>Front-run / retarget:</strong> claim signatures bind destination; a copied signature
            must not verify for another address (demo check above; Envelope release message on Sepolia).
          </li>
          <li>
            <strong>Double-claim:</strong> after status claimed, further claims refuse (ledger + on-chain
            anonymizer).
          </li>
          <li>
            <strong>Link leakage:</strong> claim keys live in the URL hash. Backup/bearer links (which embed
            keys) may be stored in this browser only; separate raw private-key fields are not persisted. Keys
            never reach query strings or server logs.
          </li>
          <li>
            <strong>Expiry / refund:</strong> past expiry, claim closes. Refund-to-note needs a STRK20
            privacy wallet (SDK). Public funders must still keep the refund link offline.
          </li>
          <li>
            <strong>Privacy honesty:</strong> public fund reveals funder; private fund needs STRK20 Wallet
            API. Amounts and envelope motion remain observable.
          </li>
          <li>
            <strong>Not audited / no mainnet:</strong> Sepolia demos only. Formal review is out of Seed MVP
            scope for the $2k ask.
          </li>
        </ul>
      </section>

      <section className="panel">
        <ol className="flow-list">
          <li>
            <span className="n">01</span>
            <div>
              <strong>
                <Tooltip
                  title="Bearer links"
                  body="The claim fragment is the instrument. Possession equals authority to attempt a claim."
                >
                  Bearer links
                </Tooltip>
              </strong>
              <p>
                Anyone with the claim fragment can attempt a claim. Treat the URL like cash. Fragments stay
                client-side. Do not put keys in query strings or server logs.
              </p>
            </div>
          </li>
          <li>
            <span className="n">02</span>
            <div>
              <strong>Front-running</strong>
              <p>
                The reference escrow reveals a{' '}
                <Tooltip
                  title="Secret preimage"
                  body="If the secret appears in public calldata, a searcher can copy it and claim first."
                >
                  secret preimage
                </Tooltip>{' '}
                on claim. Claimlink’s demo and the Envelope live path bind authorization to a destination so a
                copied signature cannot be retargeted.
              </p>
            </div>
          </li>
          <li>
            <span className="n">03</span>
            <div>
              <strong>Privacy honesty</strong>
              <p>
                Hidden goal: funder identity when funding through the privacy pool. Visible: amount, that an
                envelope moved, timing correlation. Refund links are the recovery analog of viewing-key
                backup; export before funding.
              </p>
            </div>
          </li>
          <li>
            <span className="n">04</span>
            <div>
              <strong>Audit status</strong>
              <p>
                Not audited. Do not fund with mainnet capital through this UI. Sepolia public fund +
                claim_to_address are wired for Seed demos. Private pool Fund / claim-to-note submit when a
                STRK20 Wallet API is present. Prefer Envelope as a second opinion for full pool round-trips.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </main>
  )
}
