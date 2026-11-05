# Claimlink

Claim links for STRK20 — park value behind a URL so someone who is not on the privacy pool yet can still get paid.

**Default path (Seed / reviewers):** public fund from any Starknet wallet → share bearer link → recipient `claim_to_address` (needs a Starknet address; funder identity is visible).

**Optional path:** private pool Fund / claim-to-note when a STRK20 Wallet API is present (funder privacy; recipient registers a viewing key).

## Users

Builders, DAOs, and tippers who need to pay a recipient before that recipient has a viewing key — or before they are ready to claim privately.

## Tone

Precise, sober, protocol-honest. No hype about perfect anonymity. Amounts are public on both paths; funder privacy only on the private pool path.

## Constraints

Not audited. Sepolia only. Do not invent explorer hashes. Credit Envelope / strk20-envelope for the anonymizer and SDK.
