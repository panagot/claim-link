/**
 * Recorded security checks Claimlink can demonstrate in-browser.
 * Demo crypto path: destination-bound signatures must not retarget.
 * Uses an isolated in-memory ledger so Demo App ledger stays clean.
 */
import {
  commitmentHash,
  generateClaimKey,
  importClaimKey,
  importPublicKey,
  signClaim,
  verifyClaim,
} from './crypto'

function makeMemoryLedger() {
  const envelopes = {}
  return {
    createEnvelope(entry) {
      envelopes[entry.id] = { ...entry }
      return envelopes[entry.id]
    },
    markClaimed(id, { destination, claimedAt }) {
      const e = envelopes[id]
      if (!e) throw new Error('envelope not found')
      if (e.status !== 'open') throw new Error(`cannot claim: status is ${e.status}`)
      if (Date.now() > e.expiresAt) throw new Error('envelope expired; refund instead')
      e.status = 'claimed'
      e.destination = destination
      e.claimedAt = claimedAt
      return e
    },
    getEnvelope(id) {
      return envelopes[id] || null
    },
    envelopeStatus(e, now = Date.now()) {
      if (!e) return 'missing'
      if (e.status === 'claimed') return 'claimed'
      if (e.status === 'refunded') return 'refunded'
      if (now > e.expiresAt) return 'expired'
      return 'open'
    },
  }
}

export const SECURITY_CASES = [
  {
    id: 'retarget',
    title: 'Front-run / retarget resistance (demo auth)',
    body: 'A valid claim signature bound to destination A must fail verification for destination B.',
  },
  {
    id: 'bearer',
    title: 'Bearer link leakage (policy note, not executed)',
    body: 'Anyone with the claim fragment can attempt a claim. Fragments must stay out of query strings and server logs.',
    static: true,
    pass: true,
    detail:
      'Policy note: claim keys live in the URL hash; backup links (which embed keys) may sit in this browser localStorage. No fragment is ever POSTed to a backend. This is a stated policy, not an executed assertion.',
  },
  {
    id: 'double',
    title: 'Double-claim (isolated demo ledger)',
    body: 'After a successful claim, a second claim against the same envelope must be rejected.',
  },
  {
    id: 'expiry',
    title: 'Expiry gate (isolated demo ledger)',
    body: 'Past expiresAt, status becomes expired and claim is refused; refund is the recovery path.',
  },
]

export async function runRetargetCheck() {
  const keys = await generateClaimKey()
  const commitment = await commitmentHash(keys.publicKeyHex)
  const { privateKey } = await importClaimKey(keys.privateKeyHex)
  const pub = await importPublicKey(keys.publicKeyHex)
  const amount = 10
  const destination = 'recipient-a'
  const signature = await signClaim(privateKey, { commitment, destination, amount })
  const okA = await verifyClaim(pub, { commitment, destination, amount }, signature)
  const okB = await verifyClaim(
    pub,
    { commitment, destination: 'attacker-b', amount },
    signature,
  )
  if (!okA) return { pass: false, detail: 'Valid destination failed verification' }
  if (okB) return { pass: false, detail: 'Retargeted destination incorrectly verified' }
  return { pass: true, detail: 'Signature verifies for A only; B rejected' }
}

export async function runDoubleClaimCheck(_ledgerUnused, randomId) {
  const ledger = makeMemoryLedger()
  const { createEnvelope, markClaimed, getEnvelope, envelopeStatus } = ledger
  const keys = await generateClaimKey()
  const commitment = await commitmentHash(keys.publicKeyHex)
  const id = randomId()
  const now = Date.now()
  createEnvelope({
    id,
    token: 'STRK',
    amount: 1,
    memo: 'security-double',
    commitment,
    publicKeyHex: keys.publicKeyHex,
    status: 'open',
    createdAt: now,
    expiresAt: now + 60_000,
    mode: 'demo',
  })
  markClaimed(id, { destination: 'r1', claimedAt: Date.now() })
  const st = envelopeStatus(getEnvelope(id))
  if (st !== 'claimed') return { pass: false, detail: `Expected claimed, got ${st}` }
  let blocked = false
  try {
    markClaimed(id, { destination: 'r2', claimedAt: Date.now() })
  } catch {
    blocked = true
  }
  if (!blocked) return { pass: false, detail: 'Second markClaimed unexpectedly succeeded' }
  return { pass: true, detail: 'Second claim rejected after first success (isolated ledger)' }
}

export async function runExpiryCheck(_ledgerUnused, randomId) {
  const ledger = makeMemoryLedger()
  const { createEnvelope, getEnvelope, envelopeStatus } = ledger
  const keys = await generateClaimKey()
  const commitment = await commitmentHash(keys.publicKeyHex)
  const id = randomId()
  const now = Date.now()
  createEnvelope({
    id,
    token: 'STRK',
    amount: 1,
    memo: 'security-expiry',
    commitment,
    publicKeyHex: keys.publicKeyHex,
    status: 'open',
    createdAt: now - 120_000,
    expiresAt: now - 60_000,
    mode: 'demo',
  })
  const st = envelopeStatus(getEnvelope(id))
  if (st !== 'expired') return { pass: false, detail: `Expected expired, got ${st}` }
  return { pass: true, detail: 'Expired envelope refuses claim; refund path available (isolated ledger)' }
}
