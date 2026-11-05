import { switchWalletToSepolia, WALLET_INSTALLS } from '../lib/wallet'
import { useNetwork } from './NetworkContext'
import Tooltip from './Tooltip'
import { useWallet } from './WalletContext'

function shortAddr(a) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ''
}

export default function WalletButton() {
  const { address, status, isSepolia, hasWallet, errorCode, connect, disconnect, error } = useWallet()
  const { network } = useNetwork()
  const wrongNet = network.live && address && isSepolia === false
  const noWallet = errorCode === 'NO_WALLET' || (status !== 'connected' && !hasWallet && status === 'error')

  // Connected: show address + disconnect, warn if off Sepolia.
  if (status === 'connected' && address) {
    return (
      <div className="wallet-cluster">
        {wrongNet ? (
          <button
            type="button"
            className="wallet-warn"
            onClick={() => switchWalletToSepolia().catch(() => {})}
            title="Wallet is not on Starknet Sepolia. Click to switch."
          >
            Wrong network
          </button>
        ) : null}
        <Tooltip
          title="Connected wallet"
          body="Fund and claim use this account."
          compact
          hideMark
        >
          <span className="wallet-pill on">
            <span className={`wallet-dot ${wrongNet ? 'warn' : ''}`} />
            {shortAddr(address)}
          </span>
        </Tooltip>
        <button
          type="button"
          className="wallet-signout"
          onClick={disconnect}
          title="Sign out / disconnect wallet"
        >
          Sign out
        </button>
      </div>
    )
  }

  // No wallet found: recommend an extension to install.
  if (noWallet) {
    return (
      <div className="wallet-cluster wallet-install">
        <span className="wallet-install-label">No wallet found. Install:</span>
        {WALLET_INSTALLS.map((w) => (
          <a key={w.id} href={w.url} target="_blank" rel="noreferrer" className="wallet-chip">
            {w.label}
          </a>
        ))}
        <button type="button" className="kit-link" onClick={() => connect().catch(() => {})}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-cluster">
      <button
        type="button"
        className="wallet-pill"
        onClick={() => connect().catch(() => {})}
        disabled={status === 'connecting'}
        title={status === 'error' && error ? error : 'Connect Braavos or Argent X (Ready) for the Sepolia path'}
      >
        {status === 'connecting' ? 'Connecting…' : status === 'error' ? 'Retry connect' : 'Connect wallet'}
      </button>
      {status === 'error' && error ? <span className="wallet-err" title={error}>{error}</span> : null}
    </div>
  )
}
