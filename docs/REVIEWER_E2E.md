# Reviewer Sepolia E2E (public path)

Honest path with Argent X / Braavos — **no STRK20 privacy Wallet API required**.

Live: https://claim-link.vercel.app · Seed page: `/seed`

## Prep

1. Open the live site (or `npm run dev`).
2. Click **Try public Sepolia path** (or header Network → Sepolia).
3. Confirm Status probes are green.
4. Wallet on Starknet Sepolia with a little testnet STRK.

## Path

1. **App → Create** → amount (e.g. `0.1`) → Generate claim + refund links.
2. Download backup JSON. Tick **"I backed up the refund link"** and the **bearer cash** confirm — Fund publicly and Copy claim link stay disabled until you do.
3. **Fund publicly** → approve → wait for confirmation. On timeout you get an explicit "submitted, confirm on explorer" warning, not a false success.
4. **Open as recipient** (button on the funded result) → Read on-chain → **Claim to address**.
5. Security → Run checks (isolated demo ledger).
6. Seed → Copy for Seed submission · fill `src/config/operatorProof.js` with the real txs.

## Refund honesty

`claim_to_address` works without a viewing key. **Expiry refund-to-note** needs a STRK20 privacy wallet (SDK). Keep the refund link offline.

## Operator proof

After the first successful run, set in `src/config/operatorProof.js`:

- `fundTx`
- `claimTx`
- optional `demoVideoUrl` (90s screen capture)

Until then Seed shows “pending” — do not invent hashes.

## Security note

In-app checks are **demo crypto / isolated ledger**. Not an audit. No mainnet-size funds.
