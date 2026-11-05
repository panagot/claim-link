import SealVisual from '../SealVisual'
import Tooltip from '../Tooltip'

/** G4 — protocol value-flow figure with annotated jargon. */
export default function ProtocolFigure() {
  return (
    <figure className="chart-figure protocol-figure">
      <figcaption className="chart-cap">
        <span>Protocol flow</span>
        <span className="chart-sub">Fund → bearer fragment → claim or refund</span>
      </figcaption>
      <SealVisual />
      <ul className="anno-row">
        <li>
          <Tooltip
            title="Commitment"
            body="On-chain handle for the envelope. Demo hashes a pubkey; live Envelope keys the envelope by stark-curve public key."
          >
            Commitment
          </Tooltip>
        </li>
        <li>
          <Tooltip
            title="Destination-bound signature"
            body="Claim authorization is welded to one destination so a mempool copy cannot retarget funds."
          >
            Destination-bound sig
          </Tooltip>
        </li>
        <li>
          <Tooltip
            title="claim_to_address"
            body="Default Seed path: claim a publicly funded envelope to any Starknet address. No viewing key."
          >
            claim_to_address
          </Tooltip>
        </li>
        <li>
          <Tooltip
            title="Open note"
            body="Optional private path: shielded note credit after claim-to-note when a STRK20 Wallet API is present."
            href="https://strk20.starknet.io/docs/helpers/escrow"
            hrefLabel="Escrow docs"
          >
            Open note (optional)
          </Tooltip>
        </li>
      </ul>
    </figure>
  )
}
