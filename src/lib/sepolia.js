import { RpcProvider } from 'starknet'
import { readEnvelope, toPublicKey, decodeLinkFragment } from 'strk20-envelope'
import { NETWORKS } from '../config/networks'

export function getProvider(networkId = 'sepolia') {
  const n = NETWORKS[networkId]
  if (!n?.rpcUrl) throw new Error('Network has no RPC')
  return new RpcProvider({ nodeUrl: n.rpcUrl })
}

function short(addr) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

async function probeContract(provider, address, label) {
  const started = performance.now()
  try {
    const classHash = await provider.getClassHashAt(address)
    return {
      label,
      address,
      short: short(address),
      ok: true,
      classHash,
      ms: Math.round(performance.now() - started),
    }
  } catch (err) {
    return {
      label,
      address,
      short: short(address),
      ok: false,
      error: err?.message || String(err),
      ms: Math.round(performance.now() - started),
    }
  }
}

/** Live health for Sepolia pool + anonymizer. */
export async function probeSepolia() {
  const net = NETWORKS.sepolia
  const provider = getProvider('sepolia')
  const started = performance.now()
  let blockNumber = null
  let blockError = null
  try {
    blockNumber = await provider.getBlockNumber()
  } catch (err) {
    blockError = err?.message || String(err)
  }

  const [pool, anonymizer] = await Promise.all([
    probeContract(provider, net.pool, 'STRK20 Privacy Pool'),
    probeContract(provider, net.anonymizer, 'Envelope Anonymizer'),
  ])

  const ok = Boolean(blockNumber) && pool.ok && anonymizer.ok
  return {
    ok,
    network: net,
    blockNumber,
    blockError,
    pool,
    anonymizer,
    ms: Math.round(performance.now() - started),
    checkedAt: Date.now(),
  }
}

export async function readSepoliaEnvelopeFromFragment(hashOrFragment) {
  const decoded = decodeLinkFragment(hashOrFragment)
  if (!decoded?.privateKey) throw new Error('Not a valid Envelope claim fragment')
  const claimPublicKey = toPublicKey(decoded.privateKey)
  const provider = getProvider('sepolia')
  const state = await readEnvelope(provider, NETWORKS.sepolia.anonymizer, claimPublicKey)
  return { claimPublicKey, kind: decoded.kind, state }
}

export function explorerContract(networkId, address) {
  const n = NETWORKS[networkId]
  if (!n?.explorer) return address
  return `${n.explorer}/contract/${address}`
}

export function explorerTx(networkId, hash) {
  const n = NETWORKS[networkId]
  if (!n?.explorer) return hash
  return `${n.explorer}/tx/${hash}`
}

/** Wait until a Sepolia tx is accepted (or timeout). */
export async function waitForSepoliaTx(txHash, { timeoutMs = 120_000 } = {}) {
  const provider = getProvider('sepolia')
  if (typeof provider.waitForTransaction === 'function') {
    try {
      return await provider.waitForTransaction(txHash, {
        successStates: ['ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'],
      })
    } catch (e) {
      const msg = String(e?.message || e)
      if (/REVERT|REJECT/i.test(msg)) {
        throw Object.assign(new Error(`Transaction failed on-chain: ${msg}`), { code: 'TX_FAILED' })
      }
      throw e
    }
  }
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash)
      const status = receipt?.finality_status || receipt?.execution_status || receipt?.status
      if (status && String(status).includes('ACCEPTED')) return receipt
      if (status === 'REVERTED' || status === 'REJECTED') {
        throw Object.assign(new Error(`Transaction ${status}`), { code: 'TX_FAILED' })
      }
    } catch (e) {
      if (e?.code === 'TX_FAILED' || String(e.message || e).includes('Transaction')) throw e
    }
    await new Promise((r) => setTimeout(r, 2500))
  }
  throw Object.assign(
    new Error('Timed out waiting for Sepolia confirmation. Re-read on-chain status manually.'),
    { code: 'TX_TIMEOUT' },
  )
}

/** Classify wait result without treating timeout as success. */
export async function waitForSepoliaTxOutcome(txHash, opts) {
  try {
    const receipt = await waitForSepoliaTx(txHash, opts)
    return { status: 'confirmed', receipt }
  } catch (e) {
    if (e?.code === 'TX_TIMEOUT' || String(e?.message || e).includes('Timed out')) {
      return { status: 'timeout', error: e }
    }
    return { status: 'failed', error: e }
  }
}

/** Human STRK from 18-decimal raw bigint/string. */
export function formatStrkAmount(raw, decimals = 18) {
  try {
    let s = BigInt(raw).toString()
    const neg = s.startsWith('-')
    if (neg) s = s.slice(1)
    if (s.length <= decimals) s = s.padStart(decimals + 1, '0')
    const whole = s.slice(0, s.length - decimals) || '0'
    const frac = s.slice(s.length - decimals).replace(/0+$/, '')
    const out = frac ? `${whole}.${frac}` : whole
    return neg ? `-${out}` : out
  } catch {
    return String(raw)
  }
}
