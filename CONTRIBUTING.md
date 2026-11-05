# Contributing

Thanks for helping improve Claimlink.

## Before you start

1. Read the [README](README.md) honesty section (testnet, not audited).
2. Prefer changes that keep **public fund → claim_to_address** working with any Starknet wallet.
3. Do not invent explorer tx hashes or fill `operatorProof.js` with placeholders.

## Setup

```bash
npm install
npm run dev
npm run test:smoke
npm run lint
```

## Pull requests

- Keep diffs focused (one concern per PR when possible).
- Match existing tone: precise, protocol-honest, no hype.
- Update docs if you change reviewer paths, network config, or security claims.
- Run `npm run build` and `npm run test:smoke` before opening a PR.

## Code of conduct

Be respectful. This is an early Seed-stage public good for the Starknet ecosystem.
