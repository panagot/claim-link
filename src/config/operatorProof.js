/**
 * Pinned Sepolia proof for Seed reviewers (static).
 * Fill after the first successful public fund → claim_to_address run.
 * Leave null until real explorer hashes exist — do not invent txs.
 */
export const OPERATOR_PROOF = {
  /** Starkscan / Voyager tx hash for public fund */
  fundTx: null,
  /** Starkscan / Voyager tx hash for claim_to_address */
  claimTx: null,
  /** Optional 90s walkthrough URL (Loom, YouTube unlisted, etc.) */
  demoVideoUrl: null,
  /**
   * Optional: a full claim link to a pre-funded, still-open Sepolia envelope.
   * Lets a reviewer claim without funding anything themselves.
   * Paste the claim link (…/app#/claim/…) after funding one envelope you are happy to give away.
   */
  sampleClaimLink: null,
  updatedAt: null,
  note: 'Operator fills after first Sepolia E2E. Local evidence on /seed still logs each browser run.',
}
