# Claimlink

**Pay someone on Starknet before they are set up to receive private payments.**

Claimlink parks testnet STRK behind a bearer claim link. A recipient with **no registered STRK20 viewing key** can still claim to any address when ready. Claim authorization is **destination-bound**, so a signature copied from the mempool cannot be retargeted.

| | |
|---|---|
| **Live** | [claim-link.vercel.app](https://claim-link.vercel.app) |
| **Network** | Starknet Sepolia (testnet) |
| **License** | MIT |
| **Stage** | Seed MVP — **not audited**, not mainnet |

> Built on the [Envelope](https://0xrlawrence.github.io/envelope/) / `strk20-envelope` stack. Claimlink did **not** invent claim links or the anonymizer contracts — it productizes the public `fund → claim_to_address` path for reviewers and operators.

---

## Why it exists

STRK20 private transfers assume the recipient already registered a viewing key. Bounty winners, grant contributors, and newcomers often have not — so a private payment cannot land.

Claimlink closes that gap:

1. **Funder** generates a claim link and funds an envelope (public path works with any wallet).
2. **Recipient** opens the link and claims to any Starknet address — no viewing key required.
3. **Unclaimed** value is refundable after expiry (private refund path needs a STRK20 Wallet API).

---

## Two honest paths

| Path | Privacy | Wallet needed | Status |
|------|---------|---------------|--------|
| **Public fund → `claim_to_address`** | Amount + funder visible | Any (Argent X / Ready, Braavos) | **Default — works today** |
| **Private pool → claim-to-note** | Funder privacy via pool | Wallet exposing STRK20 Wallet API | Wired when API present |

Amounts are public on both paths. The UI never blurs which guarantees apply.

---

## Quick start (reviewers)

### Option A — use the live site (fastest)

1. Open **[claim-link.vercel.app](https://claim-link.vercel.app)**
2. Header **Network → Starknet Sepolia** (default)
3. Confirm **[/status](https://claim-link.vercel.app/status)** probes are green
4. Follow the public path below (wallet + a little Sepolia STRK)

### Option B — run locally

```bash
git clone https://github.com/panagot/claim-link.git
cd claim-link
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build        # production build
npm run test:smoke   # wallet / chain-id smoke checks
npm run lint         # oxlint
```

---

## Reviewer E2E (public path)

**No STRK20 privacy Wallet API required.** Full steps: [`docs/REVIEWER_E2E.md`](docs/REVIEWER_E2E.md)

1. **Status** — pool + anonymizer reachable  
2. **App → Create** — amount (e.g. `0.1`), generate claim + refund links  
3. Download backup JSON · tick backup + bearer confirms  
4. **Fund publicly** (Argent X / Braavos on Sepolia) → wait for on-chain confirmation  
5. **Open as recipient** → Read on-chain → **Claim to address**  
6. **Security** — run demo checks (isolated ledger; **not an audit**)  
7. **Seed** — narrative, ask, evidence slots  

Demo ledger (header **Network → Demo**) walks create → claim → refund with no wallet.

---

## Site map

| Route | Purpose |
|-------|---------|
| [`/`](https://claim-link.vercel.app/) | Product overview |
| [`/app`](https://claim-link.vercel.app/app) | Create / claim / refund workspace |
| [`/docs`](https://claim-link.vercel.app/docs) | Protocol, invariants, glossary |
| [`/security`](https://claim-link.vercel.app/security) | Threat model + demo checks |
| [`/status`](https://claim-link.vercel.app/status) | Live Sepolia probes |
| [`/roadmap`](https://claim-link.vercel.app/roadmap) | Seed milestones |
| [`/seed`](https://claim-link.vercel.app/seed) | Seed narrative + reviewer kit |

Deep links: `/app/claim/…`, `/app/refund/…` (claim key lives in the URL fragment — never sent to a server).

---

## Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| STRK20 Privacy Pool | [`0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`](https://sepolia.starkscan.co/contract/0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91) |
| Envelope Anonymizer | [`0x05c5cdd9a2983bb4842d1a2c0b7ccdfa29d704e7217623349eb76cb237805604`](https://sepolia.starkscan.co/contract/0x05c5cdd9a2983bb4842d1a2c0b7ccdfa29d704e7217623349eb76cb237805604) |
| STRK (Sepolia) | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` |

RPC: `https://starknet-sepolia-rpc.publicnode.com`  
Explorer: [sepolia.starkscan.co](https://sepolia.starkscan.co)  
Reference app: [Envelope](https://0xrlawrence.github.io/envelope/)

Faucets: [Starknet Foundation](https://starknet-faucet.vercel.app/) · [Blast Sepolia STRK](https://blastapi.io/faucets/starknet-sepolia-strk)

---

## Stack

- **React 19** + **React Router 7** + **Vite 8** (static SPA, no backend)
- **starknet.js** — RPC, `WalletAccount`, execution
- **strk20-envelope** — keys, links, `readEnvelope`, public fund / `claim_to_address` builders
- Wallets: Argent X (Ready), Braavos via SNIP injection

```
src/
  pages/          Home, Workspace, Docs, Security, Status, Roadmap, Seed
  components/     Wallet, layout, charts, reviewer kit
  lib/            wallet, ledger, probes, security checks
  config/         networks.js, operatorProof.js
docs/
  REVIEWER_E2E.md     Default public-path walkthrough
  OPERATOR_RUNBOOK.md Pin real Sepolia tx hashes
  PROTOCOL.md         Claim-auth model
  STATUS.md           Capability checklist
```

---

## What Claimlink is / is not

**Is**

- A Seed-stage product surface for STRK20 claim links on Sepolia  
- Destination-bound claim authorization (vs front-runnable secret-preimage escrow)  
- Honest dual-path UX with live contract probes and reviewer docs  

**Is not**

- Audited software  
- Mainnet-ready or a recommendation to move mainnet-size funds  
- A new privacy pool or a claim that we invented the Envelope pattern  
- Fully private payments (amounts are public; funder privacy only on the private path)  

Pinned operator txs live in [`src/config/operatorProof.js`](src/config/operatorProof.js). Slots stay `null` until real Sepolia hashes exist — **do not invent explorer links**.

---

## Security

See [`SECURITY.md`](SECURITY.md) and the in-app [/security](https://claim-link.vercel.app/security) page.

In-browser checks (retarget resistance, double-claim, expiry) run on an **isolated demo ledger**. They are illustrative — **not a third-party audit**.

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Issues and PRs welcome once you have reproduced against Sepolia or the demo ledger.

---

## License

[MIT](LICENSE) © Panagiotis Pollis

Credits: STRK20 privacy pool · [Envelope / strk20-envelope](https://0xrlawrence.github.io/envelope/) (Sepolia anonymizer + SDK)
