/**
 * Local demo ledger for claim-link escrow.
 * Replaces the on-chain STRK20 anonymizer until proving / Sepolia wiring is ready.
 */

const STORAGE_KEY = 'strk20-claimlink-demo-v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"envelopes":{}}')
  } catch {
    return { envelopes: {} }
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function listEnvelopes() {
  return Object.values(load().envelopes).sort((a, b) => b.createdAt - a.createdAt)
}

export function getEnvelope(id) {
  return load().envelopes[id] || null
}

export function getByCommitment(commitment) {
  return listEnvelopes().find((e) => e.commitment === commitment) || null
}

export function createEnvelope(entry) {
  const state = load()
  state.envelopes[entry.id] = entry
  save(state)
  return entry
}

export function markClaimed(id, { destination, claimedAt }) {
  const state = load()
  const e = state.envelopes[id]
  if (!e) throw new Error('envelope not found')
  if (e.status !== 'open') throw new Error(`cannot claim: status is ${e.status}`)
  if (Date.now() > e.expiresAt) throw new Error('envelope expired; refund instead')
  e.status = 'claimed'
  e.destination = destination
  e.claimedAt = claimedAt
  save(state)
  return e
}

export function markRefunded(id, { refundedAt }) {
  const state = load()
  const e = state.envelopes[id]
  if (!e) throw new Error('envelope not found')
  if (e.status !== 'open') throw new Error(`cannot refund: status is ${e.status}`)
  if (Date.now() <= e.expiresAt) throw new Error('not expired yet')
  e.status = 'refunded'
  e.refundedAt = refundedAt
  save(state)
  return e
}

export function clearLedger() {
  localStorage.removeItem(STORAGE_KEY)
}

export function envelopeStatus(e, now = Date.now()) {
  if (!e) return 'missing'
  if (e.status === 'claimed') return 'claimed'
  if (e.status === 'refunded') return 'refunded'
  if (now > e.expiresAt) return 'expired'
  return 'open'
}
