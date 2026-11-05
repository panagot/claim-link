import { useState } from 'react'
import { Link } from 'react-router-dom'
import CapabilityMatrix from '../components/charts/CapabilityMatrix'
import ProtocolFigure from '../components/charts/ProtocolFigure'
import Tooltip from '../components/Tooltip'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'flow', label: 'Flow' },
  { id: 'demo-vs-live', label: 'Demo vs Sepolia' },
  { id: 'delta', label: 'Competitive delta' },
  { id: 'api', label: 'Integration' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'faq', label: 'FAQ' },
]

const FACTS = [
  { k: 'Chain', v: 'Starknet Sepolia' },
  { k: 'SDK', v: 'strk20-envelope + starknet.js' },
  { k: 'Backend', v: 'None — static SPA' },
  { k: 'Claim auth', v: 'Destination-bound' },
  { k: 'Stage', v: 'Seed prototype' },
  { k: 'Audit', v: 'Not audited' },
]

const INVARIANTS = [
  'The claim key only ever exists in the URL fragment (after #); it is never placed in a path, query string, request body, or server log.',
  'A claim authorization is bound to a single destination address, so a signature observed in the mempool cannot be replayed to a different recipient.',
  'Every envelope uses a fresh keypair. Keys are never derived from a user passphrase or reused across envelopes.',
  'Amounts are public on every path. Funder privacy exists only on the optional STRK20 private-pool path.',
  'Unclaimed value is recoverable after expiry; the refund link is the recovery handle and must be kept offline.',
  'Demo mode never touches the chain. It is an isolated localStorage ledger, labelled as such everywhere it appears.',
]

const GLOSSARY = [
  { t: 'Bearer link', d: 'A claim URL whose secret lives in the fragment. Whoever holds it can attempt a claim, like cash. Never paste it into public channels.' },
  { t: 'Viewing key', d: 'A key that lets a recipient discover encrypted notes addressed to them in the STRK20 pool. Many recipients do not have one registered yet — the gap Claimlink closes.' },
  { t: 'claim_to_address', d: 'The public claim path. The recipient claims escrowed value to any Starknet address with no viewing key required. The funder identity is visible on-chain.' },
  { t: 'Claim-to-note', d: 'The private claim path. Value is claimed into a shielded note. Requires a wallet that exposes the STRK20 Wallet API.' },
  { t: 'Destination-bound authorization', d: 'A claim signature welded to one recipient address, preventing mempool front-runners from retargeting the funds.' },
  { t: 'Secret-preimage escrow', d: 'The reference pattern where the claim secret appears in calldata on claim, making it copyable and front-runnable. Claimlink avoids this.' },
  { t: 'Anonymizer', d: 'The EnvelopeAnonymizer contract deployed on Sepolia that holds escrowed envelopes. Claimlink reads and acts against it.' },
  { t: 'Envelope', d: 'A single funded claim instrument: a commitment on-chain plus a bearer claim link off-chain.' },
]

const SNIPPETS = [
  {
    title: 'Create a claim + refund link',
    code: `import { generateKeys, buildClaimLink } from 'strk20-envelope'

// Fresh keypair per envelope — never derived from a passphrase
const claim = generateKeys()
const refund = generateKeys()

// The secret lives in the URL fragment only (#...)
const url = buildClaimLink({ origin: location.origin, key: claim.secret })
// => https://app/#/claim/e1.<public>.<fragment>`,
  },
  {
    title: 'Read on-chain envelope state (Sepolia)',
    code: `import { RpcProvider } from 'starknet'
import { readEnvelope } from 'strk20-envelope'

const provider = new RpcProvider({ nodeUrl: SEPOLIA_RPC })
const state = await readEnvelope(provider, anonymizer, envelopePubkey)
// => { status: 'funded' | 'claimed' | 'refunded', amount, expiry, claimable }`,
  },
  {
    title: 'Public fund then claim_to_address',
    code: `import { buildPublicFundCalls, buildClaimToAddressCall } from 'strk20-envelope'
import { connectWallet } from './lib/wallet'

const { account } = await connectWallet({ requireSepolia: true })

// Funder: approve + fund in one multicall
await account.execute(buildPublicFundCalls({ amount, envelopePubkey }))

// Recipient: claim to any Starknet address, no viewing key
await account.execute(buildClaimToAddressCall({ destination, proof }))`,
  },
]

const FAQ = [
  {
    q: 'Is this audited or production-ready?',
    a: 'No. It is a Seed-track prototype on Starknet Sepolia. The security checks in-app are demo crypto, not an audit. Do not move mainnet-size funds.',
  },
  {
    q: 'Is the money actually private?',
    a: 'Amounts are public on both paths. The default public path (claim_to_address) reveals the funder. Funder privacy only exists on the optional private pool path, which needs a STRK20 Wallet API most wallets do not expose yet.',
  },
  {
    q: 'Did you invent claim links or the contracts?',
    a: 'No. The Envelope project deployed the Sepolia anonymizer and the strk20-envelope SDK. Claimlink consumes that stack and ships the product surface, honest E2E, and hardening. Seed funds productization, not new contracts.',
  },
  {
    q: 'How do I verify the claim key never hits a server?',
    a: 'The key lives after the # in the URL (the fragment). Browsers never send the fragment in HTTP requests. Open DevTools → Network while creating a link: no request carries the key.',
  },
  {
    q: 'What stops someone front-running my claim?',
    a: 'Claim authorization is bound to one destination address. A signature copied from the mempool cannot be retargeted, unlike the reference secret-preimage escrow.',
  },
  {
    q: 'What if nobody claims? Can I get my funds back?',
    a: 'Yes, after expiry. Keep the refund link offline. Public-path expiry refund currently uses refund-to-note via a STRK20 Wallet API in the SDK; the refund link is your recovery handle.',
  },
  {
    q: 'Can I run the whole thing myself without trusting your deploy?',
    a: 'Yes. Clone the repo, npm install, npm run dev. The Status page probes the live contracts; the App runs the public fund → claim_to_address path with your own wallet on Sepolia.',
  },
  {
    q: 'Why is the demo mode just localStorage?',
    a: 'So reviewers can click the full create → claim → refund loop with no wallet. It is clearly labeled Demo and is separate from the live Sepolia path. It is not presented as on-chain.',
  },
]

export default function Docs() {
  const [tab, setTab] = useState('overview')

  return (
    <main className="page docs">
      <header className="page-head">
        <div>
          <p className="eyebrow">Documentation</p>
          <h1>Protocol notes</h1>
          <p className="page-lede">
            Written for Seed reviewers: what Claimlink is, what is live on Sepolia, and what is still demo.
          </p>
        </div>
      </header>

      <dl className="fact-strip">
        {FACTS.map((f) => (
          <div key={f.k}>
            <dt>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>

      <nav className="subtabs" aria-label="Docs sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' ? (
        <section className="prose panel">
          <h2>Problem</h2>
          <p>
            STRK20 private transfers need a registered{' '}
            <Tooltip
              title="Viewing key"
              body="Lets the recipient discover encrypted notes. Without it, the pool cannot privately address them."
            >
              viewing key
            </Tooltip>
            . Many recipients (contributors, bounty winners, newcomers) do not have one yet.
          </p>
          <h2>Documented workaround</h2>
          <p>
            Escrow value behind a commitment, share a claim secret off-chain, let the recipient claim into an
            open note after registration. The official STRK20{' '}
            <a href="https://strk20.starknet.io/docs/helpers/escrow" target="_blank" rel="noreferrer">
              escrow helper
            </a>{' '}
            illustrates this but is marked unofficial, unaudited, without SDK helpers, and uses a
            front-runnable secret-preimage claim.
          </p>
          <h2>Claimlink stance</h2>
          <p>
            Productize claim links with{' '}
            <Tooltip
              title="Destination-bound authorization"
              body="Claim signatures are welded to one destination so mempool copies cannot retarget funds."
            >
              destination-bound authorization
            </Tooltip>
            , expiry and refund UX, network-honest status, and documentation suitable for a Seed ask. See also{' '}
            <Link to="/security">Security</Link> and <Link to="/seed">Seed ask</Link>.
          </p>
          <h2>Protocol invariants</h2>
          <ul className="invariant-list">
            {INVARIANTS.map((inv, i) => (
              <li key={i}>
                <span className="inv-n">{String(i + 1).padStart(2, '0')}</span>
                <span>{inv}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'flow' ? (
        <section className="panel">
          <ProtocolFigure />
          <ol className="flow-list" style={{ marginTop: '1.5rem' }}>
            <li>
              <span className="n">01</span>
              <div>
                <strong>Generate keys</strong>
                <p>Fresh claim (and refund) keypair per envelope. Never derive from a user passphrase.</p>
              </div>
            </li>
            <li>
              <span className="n">02</span>
              <div>
                <strong>Fund</strong>
                <p>
                  Default: public fund from any wallet. Optional: pool Fund when a STRK20 Wallet API is present.
                  Envelope pubkey is what the chain indexes.
                </p>
              </div>
            </li>
            <li>
              <span className="n">03</span>
              <div>
                <strong>Share</strong>
                <p>Bearer URL fragment (cash). The browser strips it before any server request.</p>
              </div>
            </li>
            <li>
              <span className="n">04</span>
              <div>
                <strong>Claim or refund</strong>
                <p>
                  Public path: claim_to_address. Private: claim-to-note. Expiry refund-to-note needs a STRK20
                  privacy wallet today.
                </p>
              </div>
            </li>
          </ol>
        </section>
      ) : null}

      {tab === 'demo-vs-live' ? (
        <section className="panel">
          <CapabilityMatrix />
          <div className="prose" style={{ marginTop: '1.25rem' }}>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Demo</th>
                  <th>Sepolia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Create claim URL</td>
                  <td>Yes (local crypto)</td>
                  <td>Yes (Envelope key/link format)</td>
                </tr>
                <tr>
                  <td>Read escrow state</td>
                  <td>localStorage ledger</td>
                  <td>Live get_envelope</td>
                </tr>
                <tr>
                  <td>Public fund + claim_to_address</td>
                  <td>N/A (demo ledger)</td>
                  <td>Yes — any Starknet wallet on Sepolia</td>
                </tr>
                <tr>
                  <td>Fund via privacy pool</td>
                  <td>Simulated</td>
                  <td>When wallet exposes STRK20 API</td>
                </tr>
                <tr>
                  <td>Private note claim / refund</td>
                  <td>Simulated</td>
                  <td>When wallet exposes prepare + invoke</td>
                </tr>
              </tbody>
            </table>
            <p>
              Switch the header network to Sepolia, then open <Link to="/status">Status</Link> for probes or{' '}
              <Link to="/seed">Seed</Link> for the reviewer public-path runbook.
            </p>
          </div>
        </section>
      ) : null}

      {tab === 'delta' ? (
        <section className="prose panel">
          <h2>vs STRK20 reference escrow</h2>
          <ul>
            <li>Destination-bound claim auth instead of raw secret in calldata</li>
            <li>Product UX: create, open, status, docs, observability charts</li>
            <li>Expiry and refund paths in the product narrative</li>
          </ul>
          <h2>vs Envelope</h2>
          <p>
            <a href="https://github.com/0xrlawrence/envelope" target="_blank" rel="noreferrer">
              Envelope
            </a>{' '}
            already ships a Sepolia and Mainnet anonymizer. Claimlink wires the Sepolia deployment only
            (Envelope&apos;s Mainnet contracts are unused here) for keys, reads, and wallet actions
            (<code>buildPublicFundCalls</code>, <code>buildClaimToAddressCall</code>, private Fund /
            claim-to-note when a Wallet API is present). Seed story: distribution UX, honest E2E, hardening,
            not inventing claim links.
          </p>
        </section>
      ) : null}

      {tab === 'api' ? (
        <section className="prose panel">
          <h2>Code</h2>
          <p>
            Three snippets that mirror what the App actually runs. The full bridge lives in{' '}
            <code>src/lib/wallet.js</code>.
          </p>
          {SNIPPETS.map((s) => (
            <figure key={s.title} className="code-block">
              <figcaption>{s.title}</figcaption>
              <pre>
                <code>{s.code}</code>
              </pre>
            </figure>
          ))}
          <h2>Libraries</h2>
          <ul>
            <li>
              <code>strk20-envelope</code>: keys, links, readEnvelope, fund/claim/refund action builders
            </li>
            <li>
              <code>starknet</code>: Sepolia RPC provider + wallet <code>account.execute</code>
            </li>
            <li>
              <code>src/lib/wallet.js</code>: connect, public execute, STRK20 invoke bridge
            </li>
            <li>
              <code>src/lib/crypto.js</code>: demo destination-bound auth
            </li>
            <li>
              <code>src/lib/securityChecks.js</code>: recorded retarget / double-claim / expiry checks
            </li>
          </ul>
          <h2>Addresses (Sepolia)</h2>
          <ul>
            <li>
              <Tooltip title="Privacy pool" body="Canonical Sepolia STRK20 pool address.">
                Pool
              </Tooltip>
              : <code>0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91</code>
            </li>
            <li>
              <Tooltip title="Anonymizer" body="EnvelopeAnonymizer deployed on Sepolia for claim-link escrow.">
                Anonymizer
              </Tooltip>
              : <code>0x05c5cdd9a2983bb4842d1a2c0b7ccdfa29d704e7217623349eb76cb237805604</code>
            </li>
          </ul>
        </section>
      ) : null}

      {tab === 'glossary' ? (
        <section className="prose panel">
          <h2>Glossary</h2>
          <p>Shared vocabulary so reviewers and integrators read the rest of these docs the same way.</p>
          <dl className="glossary-list">
            {GLOSSARY.map((g) => (
              <div key={g.t} className="glossary-item">
                <dt>{g.t}</dt>
                <dd>{g.d}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {tab === 'faq' ? (
        <section className="prose panel">
          <h2>Reviewer FAQ</h2>
          <dl className="faq-list">
            {FAQ.map((item) => (
              <div key={item.q} className="faq-item">
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </main>
  )
}
