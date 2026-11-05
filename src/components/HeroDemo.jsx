import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { commitmentHash, encodeClaimLink, generateClaimKey, randomId } from '../lib/crypto'
import { createEnvelope } from '../lib/ledger'
import { useNetwork } from './NetworkContext'
import Tooltip from './Tooltip'

const TOKENS = ['STRK', 'USDC', 'ETH']

function appBase() {
  return `${window.location.origin}/app`
}

/** Live homepage teaser: really seals a demo claim link so reviewers feel the product. */
export default function HeroDemo() {
  const navigate = useNavigate()
  const { setNetworkId } = useNetwork()
  const [amount, setAmount] = useState('25')
  const [token, setToken] = useState('STRK')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const seal = async () => {
    setBusy(true)
    setCopied(false)
    try {
      const amt = Number(amount)
      if (!(amt > 0)) throw new Error('Enter an amount above zero')
      const keys = await generateClaimKey()
      const commitment = await commitmentHash(keys.publicKeyHex)
      const id = randomId()
      const createdAt = Date.now()
      const expiresAt = createdAt + 24 * 60 * 60 * 1000
      createEnvelope({
        id,
        token,
        amount: amt,
        memo: 'homepage demo',
        commitment,
        publicKeyHex: keys.publicKeyHex,
        status: 'open',
        createdAt,
        expiresAt,
        mode: 'demo',
      })
      const link = encodeClaimLink(appBase(), {
        v: 1,
        id,
        commitment,
        publicKeyHex: keys.publicKeyHex,
        privateKeyHex: keys.privateKeyHex,
        token,
        amount: amt,
        memo: 'homepage demo',
        expiresAt,
      })
      setResult({ link, amount: amt, token })
    } catch (e) {
      setResult({ error: e.message || String(e) })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!result?.link) return
    await navigator.clipboard.writeText(result.link)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const openAsRecipient = () => {
    if (!result?.link) return
    setNetworkId('demo')
    try {
      const u = new URL(result.link)
      navigate(`${u.pathname}${u.hash}`)
    } catch {
      navigate('/app')
    }
  }

  const fragment = result?.link ? `#${result.link.split('#')[1] || ''}` : ''

  return (
    <div className="hero-demo" aria-label="Seal a demo claim link">
      <div className="hero-demo-head">
        <span className="hero-demo-tag">Live demo</span>
        <span className="hero-demo-sub">Seal a claim link in one click</span>
      </div>

      <div className="hero-demo-form">
        <label>
          <span>Amount</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount"
          />
        </label>
        <label>
          <span>Token</span>
          <select value={token} onChange={(e) => setToken(e.target.value)} aria-label="Token">
            {TOKENS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn primary" onClick={seal} disabled={busy}>
          {busy ? 'Sealing…' : 'Seal claim link'}
        </button>
      </div>

      {result?.error ? <p className="hero-demo-err">{result.error}</p> : null}

      {result?.link ? (
        <div className="hero-demo-out">
          <p className="hero-demo-amt">
            <strong>
              {result.amount} {result.token}
            </strong>{' '}
            sealed behind a bearer link
          </p>
          <code className="hero-demo-frag">{fragment.slice(0, 34)}…</code>
          <div className="hero-demo-actions">
            <button type="button" onClick={copy}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button type="button" className="btn primary sm" onClick={openAsRecipient}>
              Open as recipient
            </button>
          </div>
          <p className="hero-demo-note">
            The{' '}
            <Tooltip
              title="Bearer fragment"
              body="The claim key lives after the # in the URL. It never reaches a server; anyone holding it can claim."
            >
              key lives in the fragment
            </Tooltip>
            , not on a server. This is the demo ledger.
          </p>
        </div>
      ) : (
        <p className="hero-demo-idle">
          Generates a real destination-bound key and a working demo link. No wallet needed.
        </p>
      )}
    </div>
  )
}
