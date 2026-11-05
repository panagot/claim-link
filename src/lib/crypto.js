/**
 * Claim-link crypto helpers.
 *
 * Reference STRK20 escrow commits to poseidon(ESCROW_COMMITMENT_TAG, secret).
 * That shape is front-runnable: the secret appears in claim calldata.
 *
 * This prototype commits to a stark-curve public key instead. Claiming requires
 * a signature bound to (commitment, destination). A mempool observer who copies
 * the signature cannot retarget it.
 *
 * Demo mode uses WebCrypto + a domain-separated hash. On-chain wiring will swap
 * these for Stark curve + Poseidon to match Cairo.
 */

const TAG = 'CLAIMLINK:V1'
const encoder = new TextEncoder()

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex) {
  const clean = hex.replace(/^0x/, '')
  if (clean.length % 2) throw new Error('invalid hex')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return new Uint8Array(digest)
}

export async function generateClaimKey() {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  )
  const pub = await crypto.subtle.exportKey('raw', pair.publicKey)
  const priv = await crypto.subtle.exportKey('pkcs8', pair.privateKey)
  return {
    publicKeyHex: toHex(new Uint8Array(pub)),
    privateKeyHex: toHex(new Uint8Array(priv)),
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
  }
}

export async function importClaimKey(privateKeyHex) {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    fromHex(privateKeyHex),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign'],
  )
  // Derive public key via a sign/verify round is awkward; store pubkey in link payload instead.
  return { privateKey }
}

export async function importPublicKey(publicKeyHex) {
  return crypto.subtle.importKey(
    'raw',
    fromHex(publicKeyHex),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  )
}

export async function commitmentHash(publicKeyHex) {
  const digest = await sha256(encoder.encode(`${TAG}:${publicKeyHex}`))
  return `0x${toHex(digest)}`
}

export async function signClaim(privateKey, { commitment, destination, amount }) {
  const msg = encoder.encode(`${TAG}|claim|${commitment}|${destination}|${amount}`)
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, msg)
  return toHex(new Uint8Array(sig))
}

export async function verifyClaim(publicKey, { commitment, destination, amount }, signatureHex) {
  const msg = encoder.encode(`${TAG}|claim|${commitment}|${destination}|${amount}`)
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    fromHex(signatureHex),
    msg,
  )
}

/** URL fragment is a bearer instrument — never send it to a server. */
export function encodeClaimLink(origin, payload) {
  const json = JSON.stringify(payload)
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${origin.replace(/\/$/, '')}/#/claim/${b64}`
}

export function decodeClaimLinkFragment(hash) {
  const m = String(hash || '').match(/#\/claim\/([A-Za-z0-9_-]+)/)
  if (!m) return null
  try {
    const pad = m[1] + '='.repeat((4 - (m[1].length % 4)) % 4)
    const json = decodeURIComponent(escape(atob(pad.replace(/-/g, '+').replace(/_/g, '/'))))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return toHex(bytes)
}
