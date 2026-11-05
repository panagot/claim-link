import ProgressMeter from '../components/charts/ProgressMeter'
import Tooltip from '../components/Tooltip'
import { Link } from 'react-router-dom'

export default function Roadmap() {
  const items = [
    {
      phase: 'Now',
      title: 'Product shell, Sepolia E2E public path, observatory',
      body: 'Reviewer-grade site, demo escrow, Envelope keys, live probes, public fund + claim_to_address, post-fund state, refund honesty, Seed runbook + evidence log.',
      state: 'done',
      tip: 'Shipped for Seed review. Default path is public Sepolia.',
      deliverables: [
        'Interactive site: Overview, App, Docs, Security, Status, Roadmap, Seed',
        'Demo ledger: create → claim → refund with destination-bound signatures',
        'Sepolia: Envelope keys/links, live get_envelope reads, class-hash probes',
        'Public fund + claim_to_address with receipt-wait and evidence logging',
      ],
      acceptance: 'A reviewer can run the public Sepolia path end to end with their own wallet and see on-chain state.',
    },
    {
      phase: 'Next',
      title: 'STRK20 Wallet API polish',
      body: 'Production fund-from-shielded / fund-from-wallet flows, prepare-invoke note id resolution hardening.',
      state: 'next',
      tip: 'UI exists; depends on privacy wallets that expose the STRK20 API.',
      deliverables: [
        'Robust fund-from-shielded and fund-from-wallet flows',
        'prepare-invoke note-id resolution hardening and error mapping',
        'Graceful fallback to the public path when the API is absent',
      ],
      acceptance: 'A STRK20-capable wallet can complete a private fund without manual note-id handling.',
    },
    {
      phase: 'Next',
      title: 'Private claim and public-refund gap',
      body: 'Claim-to-note onboarding. Clearer expiry refund for public funders when SDK/wallet support lands.',
      state: 'next',
      tip: 'Public refund remains Wallet-API gated in the Envelope SDK.',
      deliverables: [
        'Guided viewing-key onboarding for claim-to-note',
        'Expiry refund UX for public funders as SDK support lands',
        'Clear in-app state for each claim/refund branch',
      ],
      acceptance: 'A public funder can recover unclaimed value after expiry through a guided flow.',
    },
    {
      phase: 'Seed',
      title: 'Hardening and review',
      body: 'Expanded tests, security review notes, open-note screening policy clarity with pool upgrades.',
      state: 'later',
      tip: 'Required before any mainnet-size recommendation.',
      deliverables: [
        'Expanded automated test coverage across the claim lifecycle',
        'Security review notes and documented assumptions',
        'Open-note screening policy clarity aligned with pool upgrades',
      ],
      acceptance: 'A documented review exists before any mainnet-size recommendation is made.',
    },
  ]

  return (
    <main className="page roadmap">
      <header className="page-head">
        <div>
          <p className="eyebrow">Roadmap</p>
          <h1>From demo to Seed MVP</h1>
          <p className="page-lede">
            Seed expects an ecosystem-native proof of concept. Public Sepolia fund → claim is the honest path
            today; private Wallet API polish is what the ask funds next. See{' '}
            <Link to="/seed">Seed ask</Link>.
          </p>
        </div>
      </header>

      <ProgressMeter
        segments={[
          { id: 'now', label: 'Now', weight: 48, tone: 'done', tip: 'Shell, demo, Sepolia public E2E, security checks, Seed page.' },
          { id: 'next', label: 'Next', weight: 32, tone: 'next', tip: 'Wallet API polish + private claim/refund UX.' },
          { id: 'seed', label: 'Seed', weight: 20, tone: 'later', tip: 'Hardening, expanded tests, review.' },
        ]}
      />

      <ol className="roadmap-list">
        {items.map((item) => (
          <li key={item.title} className={item.state}>
            <span className="phase">
              <Tooltip title={item.phase} body={item.tip}>
                {item.phase}
              </Tooltip>
            </span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              {item.deliverables ? (
                <ul className="deliverables">
                  {item.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
              {item.acceptance ? (
                <p className="acceptance">
                  <span className="acc-k">Done when</span> {item.acceptance}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
