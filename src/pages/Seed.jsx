import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReviewerKit from '../components/ReviewerKit'
import Tooltip from '../components/Tooltip'
import { OPERATOR_PROOF } from '../config/operatorProof'
import { clearEvidence, formatSubmissionBlurb, latestByKind, loadEvidence } from '../lib/evidence'
import { explorerTx } from '../lib/sepolia'

const ASK_USD = 2000

export default function Seed() {
  const [evidence, setEvidence] = useState({ events: [] })

  useEffect(() => {
    setEvidence(loadEvidence())
  }, [])

  const fund = latestByKind('fund') || evidence.events.find((e) => e.kind === 'fund')
  const claim = latestByKind('claim') || evidence.events.find((e) => e.kind === 'claim')
  const other = evidence.events.filter(
    (e) => !(fund && e.tx === fund.tx) && !(claim && e.tx === claim.tx),
  )

  const copyBlurb = async () => {
    const text = formatSubmissionBlurb(explorerTx, OPERATOR_PROOF)
    await navigator.clipboard.writeText(text)
  }

  return (
    <main className="page docs seed-ask">
      <header className="page-head">
        <div>
          <p className="eyebrow">Starknet Seed</p>
          <h1>Claimlink — Seed narrative &amp; ask</h1>
          <p className="page-lede">
            Problem → Envelope vs Claimlink (honest) → public Sepolia path reviewers can run → what $
            {ASK_USD.toLocaleString()} funds next. Not audited. Not an invention claim.
          </p>
        </div>
      </header>

      <section className="panel">
        <h2>Problem</h2>
        <p>
          STRK20 private transfers assume the recipient already has a registered viewing key. Bounty winners,
          contributors, and newcomers often do not. The ecosystem needs claim links: park value now, share a
          bearer URL, let them claim when ready — without front-runnable secret-preimage escrow.
        </p>
      </section>

      <section className="panel">
        <h2>Envelope vs Claimlink (honest)</h2>
        <table className="plain-table">
          <thead>
            <tr>
              <th></th>
              <th>Envelope (reference)</th>
              <th>Claimlink</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Contracts / SDK</td>
              <td>Deployed anonymizer + <code>strk20-envelope</code></td>
              <td>Consumes the same SDK and Sepolia deployments</td>
            </tr>
            <tr>
              <td>Product surface</td>
              <td>Reference app for round-trips</td>
              <td>Reviewer instrument: workspace, status, docs, security, Seed ask</td>
            </tr>
            <tr>
              <td>What we do not claim</td>
              <td colSpan={2}>
                We did not invent claim links. Seed funds productization and hardening on top of the unfinished
                official escrow helper — not new L1 contracts or a mainnet audit.
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Default path (public Sepolia)</h2>
        <p>
          Reviewers with Argent X / Braavos should use{' '}
          <Tooltip
            title="Public fund"
            body="Funder identity is visible. Claim, time-lock, and front-run binding still apply. claim_to_address needs no viewing key."
          >
            public fund → claim_to_address
          </Tooltip>
          . Private pool Fund / claim-to-note only when a wallet exposes the STRK20 API — most wallets do not.
        </p>
        <ol className="flow-list">
          <li>
            <span className="n">01</span>
            <div>
              <strong>Status</strong>
              <p>
                Network → Sepolia. Confirm probes green on <Link to="/status">Status</Link>.
              </p>
            </div>
          </li>
          <li>
            <span className="n">02</span>
            <div>
              <strong>Seal &amp; back up</strong>
              <p>
                <Link to="/app">App</Link> → Create → generate links → download backup JSON (refund link is
                cash recovery).
              </p>
            </div>
          </li>
          <li>
            <span className="n">03</span>
            <div>
              <strong>Fund publicly</strong>
              <p>Any Starknet wallet on Sepolia. Ignore private fund unless you have a STRK20 API wallet.</p>
            </div>
          </li>
          <li>
            <span className="n">04</span>
            <div>
              <strong>Claim to address</strong>
              <p>Open as recipient → read on-chain → claim_to_address. Wait for confirmation.</p>
            </div>
          </li>
          <li>
            <span className="n">05</span>
            <div>
              <strong>Security</strong>
              <p>
                Run in-browser checks on <Link to="/security">Security</Link> (isolated demo ledger — not an
                audit).
              </p>
            </div>
          </li>
        </ol>
        <p className="muted">
          Written twin: <code>docs/REVIEWER_E2E.md</code>.
        </p>
      </section>

      <ReviewerKit />

      <section className="panel">
        <h2>Operator proof (pinned)</h2>
        <p>
          Static explorer links for the submission. Fill{' '}
          <code>src/config/operatorProof.js</code> after the first successful Sepolia E2E — do not invent
          hashes.
        </p>
        <ul className="check-list">
          <li>
            Fund tx:{' '}
            {OPERATOR_PROOF.fundTx ? (
              <a href={explorerTx('sepolia', OPERATOR_PROOF.fundTx)} target="_blank" rel="noreferrer">
                {OPERATOR_PROOF.fundTx.slice(0, 22)}…
              </a>
            ) : (
              <span className="muted">pending — run public fund, then paste hash into operatorProof.js</span>
            )}
          </li>
          <li>
            Claim tx:{' '}
            {OPERATOR_PROOF.claimTx ? (
              <a href={explorerTx('sepolia', OPERATOR_PROOF.claimTx)} target="_blank" rel="noreferrer">
                {OPERATOR_PROOF.claimTx.slice(0, 22)}…
              </a>
            ) : (
              <span className="muted">pending — run claim_to_address, then paste hash</span>
            )}
          </li>
          <li>
            90s demo:{' '}
            {OPERATOR_PROOF.demoVideoUrl ? (
              <a href={OPERATOR_PROOF.demoVideoUrl} target="_blank" rel="noreferrer">
                Watch walkthrough
              </a>
            ) : (
              <span className="muted">pending — record once and set demoVideoUrl</span>
            )}
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2>Evidence (this browser)</h2>
        <p>Auto-logged after fund/claim in App. Useful for your machine; reviewers need operator proof above.</p>
        {evidence.events.length === 0 ? (
          <p className="empty">No Sepolia txs logged yet. Complete a public fund or claim in App.</p>
        ) : (
          <ul className="check-list">
            {fund ? (
              <li>
                Fund ({fund.fundMode || 'public'}):{' '}
                <a href={explorerTx('sepolia', fund.tx)} target="_blank" rel="noreferrer">
                  {String(fund.tx).slice(0, 22)}…
                </a>
              </li>
            ) : null}
            {claim ? (
              <li>
                Claim:{' '}
                <a href={explorerTx('sepolia', claim.tx)} target="_blank" rel="noreferrer">
                  {String(claim.tx).slice(0, 22)}…
                </a>
              </li>
            ) : null}
            {other.slice(0, 3).map((e, i) => (
              <li key={`${e.tx}-${i}`}>
                <code>{e.kind}</code> · {new Date(e.at).toLocaleString()} ·{' '}
                <a href={explorerTx('sepolia', e.tx)} target="_blank" rel="noreferrer">
                  explorer
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="row-actions evidence-actions">
          <button type="button" className="btn primary" onClick={copyBlurb}>
            Copy for Seed submission
          </button>
          <button type="button" onClick={() => setEvidence(loadEvidence())}>
            Refresh
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              clearEvidence()
              setEvidence({ events: [] })
            }}
          >
            Clear evidence
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Shipped for this submission</h2>
        <ul className="check-list">
          <li>Demo ledger: create → claim → refund with destination-bound signatures</li>
          <li>Sepolia probes + Envelope keys/links + <code>get_envelope</code></li>
          <li>Public fund + claim_to_address (default reviewer path) with receipt wait</li>
          <li>Private Fund / claim-to-note / refund-to-note UI when STRK20 Wallet API is present</li>
          <li>Refund-link backup + bearer cash confirm</li>
          <li>Security checklist + isolated demo checks (explicitly not an audit)</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Known gaps (funded by the ask)</h2>
        <ul className="check-list">
          <li>Public-envelope expiry refund still needs a STRK20 privacy wallet (SDK path)</li>
          <li>Wallet API polish, prepare-invoke note id hardening, viewing-key onboarding</li>
          <li>On-chain security suite beyond demo checks; formal review before mainnet size</li>
          <li>Operator must pin real txs + optional 90s video in operatorProof.js</li>
        </ul>
      </section>

      <section className="panel">
        <h2>What Seed (${ASK_USD.toLocaleString()}) funds next</h2>
        <ol className="flow-list">
          <li>
            <span className="n">01</span>
            <div>
              <strong>STRK20 Wallet API polish</strong>
              <p>Fund-from-shielded / fund-from-wallet, prepare-invoke resolution, error mapping.</p>
            </div>
          </li>
          <li>
            <span className="n">02</span>
            <div>
              <strong>Private claim-to-note + refund UX</strong>
              <p>Viewing-key onboarding and guided expiry refund for privacy-wallet users.</p>
            </div>
          </li>
          <li>
            <span className="n">03</span>
            <div>
              <strong>Hardening</strong>
              <p>Expanded tests, security notes, open-note policy clarity with pool upgrades.</p>
            </div>
          </li>
        </ol>
        <p>
          <strong>Ask: ${ASK_USD.toLocaleString()} USD</strong> (or STRK equivalent at award) — Seed MVP
          productization only. Not a mainnet audit. Not new contracts.
        </p>
        <table className="plain-table funds-table">
          <thead>
            <tr>
              <th>Workstream</th>
              <th>Deliverable</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>STRK20 Wallet API polish</td>
              <td>Fund-from-shielded / fund-from-wallet, prepare-invoke resolution, error mapping</td>
              <td>~50%</td>
            </tr>
            <tr>
              <td>Private claim-to-note + refund UX</td>
              <td>Viewing-key onboarding and guided expiry refund</td>
              <td>~30%</td>
            </tr>
            <tr>
              <td>Hardening &amp; review</td>
              <td>Expanded tests, security notes, open-note policy clarity</td>
              <td>~20%</td>
            </tr>
          </tbody>
        </table>
        <p className="muted">
          Indicative allocation of the ${ASK_USD.toLocaleString()} ask, not a fixed contract. Scope stays
          within Seed MVP productization.
        </p>
      </section>

      <section className="panel">
        <h2>Demo script (≈90s)</h2>
        <ol>
          <li>Overview → Try public Sepolia path.</li>
          <li>Status probes green.</li>
          <li>Create → backup → Fund publicly → Open as recipient → claim_to_address.</li>
          <li>Security → run checks (label as demo).</li>
          <li>This page → evidence / operator proof + ask.</li>
        </ol>
      </section>
    </main>
  )
}
