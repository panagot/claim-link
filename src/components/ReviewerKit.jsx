import { useNavigate } from 'react-router-dom'
import { OPERATOR_PROOF } from '../config/operatorProof'
import { NETWORKS } from '../config/networks'
import { switchWalletToSepolia } from '../lib/wallet'
import { useNetwork } from './NetworkContext'
import { useWallet } from './WalletContext'
import Tooltip from './Tooltip'

function shortAddr(a) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ''
}

/** Everything a skeptical reviewer needs to run the public Sepolia path, in one place. */
export default function ReviewerKit() {
  const navigate = useNavigate()
  const { setNetworkId } = useNetwork()
  const { address, status, isSepolia, connect } = useWallet()
  const faucets = NETWORKS.sepolia.faucets || []
  const sample = OPERATOR_PROOF.sampleClaimLink

  const connected = status === 'connected' && Boolean(address)
  const onSepolia = connected && isSepolia !== false

  const claimSample = () => {
    if (!sample) return
    setNetworkId('sepolia')
    try {
      const u = new URL(sample)
      navigate(`${u.pathname}${u.hash}`)
    } catch {
      navigate('/app')
    }
  }

  const checks = [
    {
      done: connected,
      label: 'Starknet wallet connected',
      action: connected ? null : (
        <button type="button" className="kit-link" onClick={() => connect().catch(() => {})}>
          Connect wallet
        </button>
      ),
    },
    {
      done: onSepolia,
      label: 'Wallet on Starknet Sepolia',
      action: connected && !onSepolia ? (
        <button type="button" className="kit-link" onClick={() => switchWalletToSepolia().catch(() => {})}>
          Switch to Sepolia
        </button>
      ) : null,
    },
    {
      done: null,
      label: 'A little testnet STRK for gas + amount',
      action: null,
    },
  ]

  return (
    <section className="panel reviewer-kit">
      <div className="panel-head">
        <h2>Reviewer test kit</h2>
        <p>Three things to run the public Sepolia path, plus a shortcut to claim a pre-funded sample.</p>
      </div>

      <ol className="kit-checklist">
        {checks.map((c) => (
          <li key={c.label} className={c.done === true ? 'ok' : c.done === false ? 'todo' : ''}>
            <span className="kit-mark" aria-hidden="true">
              {c.done === true ? '✓' : '•'}
            </span>
            <span className="kit-label">{c.label}</span>
            {c.action ? <span className="kit-action">{c.action}</span> : null}
          </li>
        ))}
      </ol>

      <div className="kit-row">
        <div className="kit-block">
          <h3>Get testnet STRK</h3>
          <div className="kit-links">
            {faucets.map((f) => (
              <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="kit-chip">
                {f.label}
              </a>
            ))}
          </div>
          <p className="kit-note">
            Faucets are third-party. Any Sepolia STRK works for gas and the claim amount.
          </p>
        </div>

        <div className="kit-block">
          <h3>
            <Tooltip
              title="Pre-funded sample"
              body="A claim link to an envelope the operator already funded on Sepolia. Claim it to any address without funding anything yourself."
            >
              Claim a sample
            </Tooltip>
          </h3>
          {sample ? (
            <>
              <button type="button" className="btn primary sm" onClick={claimSample}>
                Claim pre-funded sample
              </button>
              <p className="kit-note">Opens the claim tab on Sepolia with a live, funded envelope.</p>
            </>
          ) : (
            <p className="kit-note">
              Pending: operator sets <code>sampleClaimLink</code> in <code>src/config/operatorProof.js</code>{' '}
              after funding one give-away envelope.
            </p>
          )}
        </div>
      </div>

      {connected ? (
        <p className="kit-conn">
          Connected: <code>{shortAddr(address)}</code>
          {isSepolia === false ? <span className="kit-warn"> · not on Sepolia</span> : null}
        </p>
      ) : null}
    </section>
  )
}
