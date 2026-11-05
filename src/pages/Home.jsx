import { Link, useNavigate } from 'react-router-dom'
import CapabilityMatrix from '../components/charts/CapabilityMatrix'
import FlowSteps from '../components/FlowSteps'
import HeroDemo from '../components/HeroDemo'
import Tooltip from '../components/Tooltip'
import { useNetwork } from '../components/NetworkContext'

const FEATURES = [
  {
    id: 'auth',
    size: 'wide',
    title: 'Destination-bound auth',
    body: 'Every claim signature is welded to one recipient address. A signature copied from the mempool cannot be retargeted, unlike secret-preimage escrow.',
    tip: { title: 'vs secret-preimage', body: 'Reference escrow puts the secret in calldata, so a front-runner can reuse it. Claimlink binds the signature to a destination.' },
  },
  {
    id: 'refund',
    title: 'Expiry + refund',
    body: 'Unclaimed value is recoverable after expiry. Funds are never stuck.',
  },
  {
    id: 'backend',
    title: 'No backend',
    body: 'The claim key lives in the URL fragment. Nothing is POSTed to a server.',
  },
  {
    id: 'anywallet',
    title: 'Any Starknet wallet',
    body: 'Public fund → claim_to_address works with Argent X or Braavos. No viewing key needed.',
  },
  {
    id: 'private',
    size: 'wide',
    title: 'Private pool path, optional',
    body: 'When a wallet exposes the STRK20 Wallet API, fund privately and claim into a shielded note. Wired today, reviewer-default stays public and honest.',
    tip: { title: 'Wallet API', body: 'Most injected wallets do not expose the STRK20 API yet. The private path is wired but optional.' },
  },
  {
    id: 'status',
    title: 'Live Sepolia status',
    body: 'Real contract probes and block height. No vanity user counts.',
  },
]

const USE_CASES = [
  { k: 'Bounties', v: 'Pay a winner before they set up a viewing key.' },
  { k: 'Grants', v: 'Disburse to contributors who are new to the pool.' },
  { k: 'Airdrops', v: 'Drop value to users who have no account yet.' },
  { k: 'Tips', v: 'Hand someone a link like cash.' },
  { k: 'DAO payroll', v: 'Queue payouts recipients claim when ready.' },
]

export default function Home() {
  const { network, health, setNetworkId } = useNetwork()
  const navigate = useNavigate()

  const openSepoliaApp = () => {
    setNetworkId('sepolia')
    navigate('/app')
  }

  const openDemoApp = () => {
    setNetworkId('demo')
    navigate('/app')
  }

  return (
    <main className="page home">
      {/* HERO */}
      <section className="hero-stage">
        <div className="hero-copy">
          <p className="brand-kicker">STRK20 · Starknet</p>
          <p className="brand-name">Claimlink</p>
          <h1>Pay someone before they are set up to receive it.</h1>
          <p className="hero-lede">
            Park value behind a{' '}
            <Tooltip
              title="Bearer link"
              body="The claim key lives in the URL fragment. It never hits the server, but anyone with the link can claim."
            >
              bearer URL
            </Tooltip>
            . They{' '}
            <Tooltip
              title="claim_to_address"
              body="Public Sepolia path. Needs a Starknet address, no viewing key. Funder identity is visible on fund."
            >
              claim to any address
            </Tooltip>{' '}
            when ready, or into a private note later once registered.
          </p>
          <div className="hero-cta">
            <button type="button" className="btn primary" onClick={openSepoliaApp}>
              Try public Sepolia path
            </button>
            <button type="button" className="btn ghost" onClick={openDemoApp}>
              Try demo
            </button>
            <Link className="hero-text-link" to="/seed">
              Seed ask →
            </Link>
          </div>
        </div>
        <HeroDemo />
      </section>

      {/* THE GAP */}
      <section className="section gap">
        <div className="section-head">
          <p className="eyebrow">The gap on Starknet</p>
          <h2>STRK20 private transfer assumes the recipient already has a viewing key. Most do not.</h2>
        </div>
        <div className="gap-grid">
          <article className="gap-card bad">
            <span className="gap-tag">Without Claimlink</span>
            <ol>
              <li>You try to send a private payment.</li>
              <li>The recipient has no registered viewing key.</li>
              <li>
                <strong>The payment cannot land.</strong>
              </li>
            </ol>
          </article>
          <div className="gap-arrow" aria-hidden="true">
            →
          </div>
          <article className="gap-card good">
            <span className="gap-tag">With Claimlink</span>
            <ol>
              <li>Fund a claim link from any wallet.</li>
              <li>Share the bearer URL like cash.</li>
              <li>
                <strong>They claim to any address now, or a private note later.</strong>
              </li>
            </ol>
          </article>
        </div>
        <p className="gap-foot">
          The STRK20 docs show an escrow claim-link pattern, but the official helper is{' '}
          <Tooltip
            title="Reference escrow"
            body="Unofficial, unaudited, no SDK helpers, and a secret-preimage claim that can be front-run from calldata."
            href="https://strk20.starknet.io/docs/helpers/escrow"
            hrefLabel="STRK20 docs"
          >
            not production-ready
          </Tooltip>
          . Claimlink turns that pattern into a product.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how">
        <div className="section-head">
          <p className="eyebrow">How it works</p>
          <h2>Seal, share, claim. Hover a step to follow the flow.</h2>
        </div>
        <FlowSteps />
      </section>

      {/* FEATURES */}
      <section className="section features">
        <div className="section-head">
          <p className="eyebrow">What you get</p>
          <h2>Built like a payout instrument, not a demo script.</h2>
        </div>
        <div className="feature-bento">
          {FEATURES.map((f) => (
            <article key={f.id} className={`feature-card ${f.size === 'wide' ? 'wide' : ''}`}>
              <h3>
                {f.tip ? (
                  <Tooltip title={f.tip.title} body={f.tip.body}>
                    {f.title}
                  </Tooltip>
                ) : (
                  f.title
                )}
              </h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="section usecases">
        <div className="section-head">
          <p className="eyebrow">Where it fits</p>
          <h2>Pay before the recipient is ready.</h2>
        </div>
        <ul className="usecase-row">
          {USE_CASES.map((u) => (
            <li key={u.k}>
              <strong>{u.k}</strong>
              <span>{u.v}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* WHAT WORKS TODAY */}
      <section className="section live-strip">
        <div className="section-head row">
          <div>
            <p className="eyebrow">What works today</p>
            <h2>Demo end-to-end. Sepolia public fund + claim live. Private pool when Wallet API exists.</h2>
          </div>
        </div>
        <div className="instrument-strip">
          <article>
            <span className="tag">Ready</span>
            <h3>Demo seal and claim</h3>
            <p>Create, open, claim, and refund in a local ledger. Destination-bound signatures, not raw secrets.</p>
            <button type="button" className="link-btn" onClick={openDemoApp}>
              Try demo
            </button>
          </article>
          <article>
            <span className={`tag ${health?.ok ? 'signal' : ''}`}>
              {network.live && health?.ok ? 'Live' : 'Sepolia'}
            </span>
            <h3>Public Sepolia path</h3>
            <p>
              Fund publicly + claim_to_address with any wallet. Probes and on-chain reads on{' '}
              <Link to="/status" onClick={() => setNetworkId('sepolia')}>
                Status
              </Link>
              .
            </p>
            <Link to="/seed">Reviewer runbook</Link>
          </article>
          <article>
            <span className="tag muted">Partial</span>
            <h3>
              <Tooltip
                title="Wallet API"
                body="Private Fund / claim-to-note / refund-to-note need a STRK20 privacy wallet. UI is wired; most injected wallets do not expose the API yet."
              >
                Private Wallet API
              </Tooltip>
            </h3>
            <p>
              Wired when present. Otherwise use public fund here, or the{' '}
              <a href="https://0xrlawrence.github.io/envelope/" target="_blank" rel="noreferrer">
                Envelope reference app
              </a>
              .
            </p>
            <Link to="/roadmap">See roadmap</Link>
          </article>
        </div>
      </section>

      {/* CAPABILITY MATRIX */}
      <section className="section matrix-section">
        <div className="section-head">
          <p className="eyebrow">Evidence</p>
          <h2>Capability by mode, without vanity metrics.</h2>
        </div>
        <CapabilityMatrix />
      </section>

      {/* POSITIONING */}
      <section className="section honesty">
        <div className="section-head">
          <p className="eyebrow">Positioning</p>
          <h2>Built for Seed scrutiny, not invention theater.</h2>
        </div>
        <div className="honesty-grid">
          <div>
            <h3>vs reference escrow</h3>
            <p>
              Official helper is an illustration. Claimlink productizes claim UX with destination-bound auth,
              expiry and refund narrative, and network-honest status.
            </p>
          </div>
          <div>
            <h3>
              <Tooltip
                title="Envelope"
                body="Prior STRK20 sprint project that deployed the Sepolia anonymizer Claimlink reads against."
                href="https://github.com/0xrlawrence/envelope"
                hrefLabel="GitHub"
              >
                vs Envelope
              </Tooltip>
            </h3>
            <p>
              Envelope already deployed the Sepolia anonymizer. Claimlink reuses that live surface for keys,
              public fund / claim_to_address, and private Wallet API actions when present. Product UX and Seed
              honesty, not inventing claim links.
            </p>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="cta-band">
        <div>
          <h2>See it work in under a minute.</h2>
          <p>Seal a link on the demo ledger, then run the public path on Starknet Sepolia.</p>
        </div>
        <div className="cta-band-actions">
          <button type="button" className="btn primary" onClick={openSepoliaApp}>
            Try public Sepolia path
          </button>
          <button type="button" className="btn ghost" onClick={openDemoApp}>
            Try demo
          </button>
          <Link className="btn ghost" to="/seed">
            Seed ask
          </Link>
        </div>
      </section>
    </main>
  )
}
