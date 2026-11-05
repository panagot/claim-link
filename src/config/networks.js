/** Canonical STRK20 + Envelope deployments we can actually probe. */

export const NETWORKS = {
  demo: {
    id: 'demo',
    label: 'Demo ledger',
    short: 'Demo',
    live: false,
    description: 'Local browser escrow. No chain calls. Safe for UX walkthroughs.',
  },
  sepolia: {
    id: 'sepolia',
    label: 'Starknet Sepolia',
    short: 'Sepolia',
    live: true,
    chainId: '0x534e5f5345504f4c4941',
    rpcUrl: 'https://starknet-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.starkscan.co',
    pool: '0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91',
    /** EnvelopeAnonymizer — funded through the Sepolia STRK20 pool */
    anonymizer: '0x05c5cdd9a2983bb4842d1a2c0b7ccdfa29d704e7217623349eb76cb237805604',
    strk: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    referenceApp: 'https://0xrlawrence.github.io/envelope/',
    faucets: [
      { label: 'Starknet Foundation faucet', url: 'https://starknet-faucet.vercel.app/' },
      { label: 'Blast Sepolia STRK faucet', url: 'https://blastapi.io/faucets/starknet-sepolia-strk' },
    ],
    description:
      'Live testnet. Default: public fund + claim_to_address (any wallet). Private pool path only when a STRK20 Wallet API is present.',
  },
}

/** Starknet Sepolia testnet is the forced default. Demo ledger stays reachable as a labeled fallback. */
export const DEFAULT_NETWORK = 'sepolia'
