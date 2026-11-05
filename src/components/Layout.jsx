import { NavLink, Outlet } from 'react-router-dom'
import Logo from './Logo'
import { useNetwork } from './NetworkContext'
import Tooltip from './Tooltip'
import WalletButton from './WalletButton'

const NAV = [
  { to: '/', end: true, label: 'Overview' },
  { to: '/app', label: 'App' },
  { to: '/docs', label: 'Docs' },
  { to: '/security', label: 'Security' },
  { to: '/status', label: 'Status' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/seed', label: 'Seed' },
]

export default function Layout() {
  const { networkId, setNetworkId, network, health, probing, networks } = useNetwork()

  return (
    <div className="site">
      <div className="paper-noise" aria-hidden="true" />
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="logo">
            <Logo size={40} />
            <span className="logo-text">
              <strong>Claimlink</strong>
              <em>STRK20 claim instrument</em>
            </span>
          </NavLink>

          <nav className="main-nav" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'on' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-tools">
            <div className="net-cluster">
              <Tooltip
                wide
                title="Network mode"
                body={
                  network.live
                    ? 'Sepolia: public fund + claim_to_address via ordinary wallets; private pool Fund when STRK20 Wallet API is present.'
                    : 'Demo stores envelopes only in this browser. No chain calls.'
                }
                compact
                hideMark
              >
                <select
                  className="net-select"
                  value={networkId}
                  onChange={(e) => setNetworkId(e.target.value)}
                  aria-label="Network"
                >
                  {Object.values(networks).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.short}
                    </option>
                  ))}
                </select>
              </Tooltip>
              <Tooltip
                title={network.live ? 'Sepolia probe' : 'Demo mode'}
                body={
                  network.live
                    ? health?.ok
                      ? 'Latest class-hash probes succeeded for pool and anonymizer.'
                      : probing
                        ? 'Probe in flight.'
                        : 'Latest probe failed or has not succeeded yet. Open Status.'
                    : 'Local ledger only. Switch to Sepolia for live probes.'
                }
                compact
                hideMark
              >
                <span
                  className={`net-pill ${network.live ? (health?.ok ? 'live' : probing ? 'wait' : 'down') : 'demo'}`}
                >
                  {network.live ? (probing ? 'checking' : health?.ok ? 'sepolia live' : 'sepolia issue') : 'demo'}
                </span>
              </Tooltip>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo size={44} />
            <div>
              <strong>Claimlink</strong>
              <p>
                Claim links for recipients not on the STRK20 pool yet. Default path is public fund →
                claim_to_address; funder privacy is optional via the pool. Seed-track prototype on Sepolia.
              </p>
            </div>
          </div>
          <div className="footer-grid">
            <div>
              <h3>Product</h3>
              <NavLink to="/app">Open app</NavLink>
              <NavLink to="/status">Network status</NavLink>
              <NavLink to="/roadmap">Roadmap</NavLink>
              <NavLink to="/seed">Seed ask</NavLink>
            </div>
            <div>
              <h3>Docs</h3>
              <NavLink to="/docs">Protocol</NavLink>
              <NavLink to="/security">Threat model</NavLink>
              <a href="https://strk20.starknet.io/docs/helpers/escrow" target="_blank" rel="noreferrer">
                STRK20 escrow docs
              </a>
            </div>
            <div>
              <h3>Network</h3>
              <a
                href="https://sepolia.starkscan.co/contract/0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91"
                target="_blank"
                rel="noreferrer"
              >
                Sepolia pool
              </a>
              <a
                href="https://sepolia.starkscan.co/contract/0x05c5cdd9a2983bb4842d1a2c0b7ccdfa29d704e7217623349eb76cb237805604"
                target="_blank"
                rel="noreferrer"
              >
                Anonymizer
              </a>
              <a href="https://0xrlawrence.github.io/envelope/" target="_blank" rel="noreferrer">
                Envelope reference
              </a>
            </div>
            <div>
              <h3>Honesty</h3>
              <p className="footer-note">
                <Tooltip
                  title="Not audited"
                  body="Do not move mainnet-size funds through this UI. Public Sepolia path is for demos. Private pool round-trips need a STRK20 Wallet API or Envelope."
                >
                  Not audited
                </Tooltip>
                . Not StarkWare. Demo + Sepolia public path today; private Wallet API when present.
              </p>
              <p className="footer-note">
                <Tooltip
                  title="Bearer instrument"
                  body="Whoever holds the claim fragment can attempt a claim. Never paste links into public channels."
                >
                  Bearer links are cash
                </Tooltip>
                .
              </p>
            </div>
          </div>
        </div>
        <div className="footer-base">
          <span>Claimlink · STRK20 · Starknet Sepolia</span>
          <span>Linked-seal mark · paper vault system</span>
        </div>
      </footer>
    </div>
  )
}
