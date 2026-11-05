# Operator runbook — produce real proof before submitting

This is the one task only you can do. It turns the Seed page from "pending" into clickable, verifiable proof. **Do not invent hashes** — every value below must come from a real Sepolia transaction you run.

Time: ~15 minutes. You need a browser wallet and a little testnet STRK.

---

## 0. Prerequisites

1. Install **Argent X** or **Braavos** browser extension and create/unlock a wallet.
2. Switch the wallet network to **Starknet Sepolia**.
3. Get testnet STRK from a faucet (also linked in-app on `/seed` → Reviewer test kit):
   - Starknet Foundation faucet: https://starknet-faucet.vercel.app/
   - Blast Sepolia STRK faucet: https://blastapi.io/faucets/starknet-sepolia-strk
4. Confirm `/status` shows **Reachable** (pool + anonymizer "up").

## 1. Fund a claim link (captures `fundTx`)

1. Open the live app → **Network: Sepolia** → header **Connect wallet** → confirm address shows and no "Wrong network" chip.
2. **App → Create**: amount `0.1`, expiry `24`, generate claim + refund links.
3. **Download the backup JSON** and tick both confirms (backup + bearer cash).
4. Click **Fund publicly** → approve in the wallet → wait for "confirmed on-chain".
5. In the wallet or on the "Fund tx" link, copy the **transaction hash**. This is `fundTx`.
6. **Copy the claim link** (you will reuse it for the sample and for the claim step). Keep the refund link safe.

## 2. Claim it (captures `claimTx`)

1. On the funded result, click **Open as recipient** (or paste the claim link in **Open link**).
2. Click **Read on-chain state** → status should be `funded`, claimable `yes`.
3. Leave recipient blank (uses connected wallet) or paste any Sepolia address.
4. Click **Claim to address** → approve → wait for "confirmed on-chain".
5. Copy this **transaction hash**. This is `claimTx`.

## 3. (Optional but strong) Leave a pre-funded sample

So reviewers can claim without funding anything:

1. Repeat step 1 (fund `0.1` STRK) but **do not claim it**.
2. Keep that **claim link** — this is `sampleClaimLink`.
3. (You are effectively giving this 0.1 STRK to whoever claims first. That is the point.)

## 4. Record a 90s walkthrough (optional, high value)

Screen-record: Overview → Status green → App create → Fund publicly → Open as recipient → Claim. Upload (Loom / unlisted YouTube). URL is `demoVideoUrl`.

## 5. Pin the proof

Edit `src/config/operatorProof.js`:

```js
export const OPERATOR_PROOF = {
  fundTx: '0x…',            // from step 1
  claimTx: '0x…',           // from step 2
  demoVideoUrl: null,       // or your video URL from step 4
  sampleClaimLink: null,    // or the claim link from step 3
  updatedAt: '2026-11-05',
  note: 'Pinned after a real Sepolia E2E.',
}
```

Then rebuild and redeploy:

```bash
npm run build
git add -A && git commit -m "Pin real Sepolia operator proof" && git push origin main
```

Vercel redeploys automatically. The Seed page now shows live explorer links and the test kit offers a one-click sample claim.

## 6. Verify like a reviewer would

- `/seed` → Operator proof shows **clickable Starkscan links** (not "pending").
- Each link opens a real **ACCEPTED** tx on `sepolia.starkscan.co`.
- `/seed` → Reviewer test kit → **Claim pre-funded sample** loads a live funded envelope.
- "Copy for Seed submission" now includes the pinned txs.

---

### Repository

Public MIT source: https://github.com/panagot/claim-link — clone and run with `npm install && npm run dev`.
