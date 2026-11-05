# Claim Link protocol (prototype)

## Problem

You cannot privately transfer STRK20 to someone who has not registered a viewing key. Escrow + off-chain claim link is the documented workaround.

## Reference helper (gap)

The STRK20 docs escrow:

- Stores `poseidon(ESCROW_COMMITMENT_TAG, secret)` on deposit
- Releases on claim by revealing `secret` in calldata
- Double-claim flag only

Gap: secret in calldata → mempool front-run. Also: unofficial, unaudited, no SDK, no public deployment.

## Prototype claim auth

Commit to a **public key**, not a raw secret.

1. Funder generates claim keypair
2. On-chain / ledger stores `commitment = H(tag || pubkey)`
3. Claimant signs `claim | commitment | destination | amount`
4. Verifier checks signature under stored pubkey
5. Retargeting the destination invalidates the signature

Demo uses WebCrypto P-256 + SHA-256. Production Cairo should use Stark curve + Poseidon to match STRK20.

## Lifecycle

```
Fund (open) → Claim (destination-bound) | Expire → Refund
```

## Privacy honesty

- **Hidden (target):** funder identity when funded from the privacy pool
- **Visible:** amount, that an envelope was funded/claimed, timing
- **Link is bearer:** whoever has the fragment can claim
- Round amounts reduce amount-correlation

## Viewing keys

Claiming into a shielded note still requires recipient registration / viewing-key setup. UX must treat key backup as first-class (STRK20 docs: keys are not casually rotatable).
