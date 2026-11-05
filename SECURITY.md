# Security Policy

## Status

Claimlink is a **Starknet Sepolia testnet prototype**. It has **not** received a formal third-party audit.

**Do not move mainnet-size funds through this software.**

## What we protect

| Concern | Approach |
|---------|----------|
| Mempool front-running / retarget | Destination-bound claim signatures (welded to one recipient address) |
| Server-side key leakage | No backend; claim key lives in the URL fragment only |
| Stuck funds | Expiry + refund path (private refund needs STRK20 Wallet API) |
| Double claim | On-chain / ledger spent flag |

## What we do not claim

- Perfect anonymity or “invisible money”
- That in-app Security page checks equal an audit (they use an isolated demo ledger)
- Mainnet readiness

## Reporting a vulnerability

Email **panagiotispollis@gmail.com** with:

- Description and impact
- Steps to reproduce (Sepolia preferred)
- Whether funds are at risk on testnet

Please allow reasonable time before public disclosure. Do not open a public issue for active fund-risk bugs.

## Scope notes

- Contracts consumed (pool + anonymizer) are upstream Envelope / STRK20 deployments — report contract-level issues to those maintainers as well when applicable.
- Demo ledger mode never touches chain; treat it as UX-only.
