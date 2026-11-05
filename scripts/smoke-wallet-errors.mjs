/**
 * Tiny smoke checks (no vitest). Run: node scripts/smoke-wallet-errors.mjs
 * Mirrors formatWalletError rules without importing browser modules.
 */

function formatWalletError(err) {
  if (!err) return 'Unknown wallet error'
  if (err.code === 'NO_STRK20') {
    return 'This wallet has no STRK20 privacy API. Use Fund publicly (any Argent X / Braavos), or a STRK20-capable privacy wallet.'
  }
  if (err.code === 'WRONG_NETWORK') {
    return err.message || 'Switch the wallet to Starknet Sepolia, then retry.'
  }
  const raw = String(err.message || err || '')
  const lower = raw.toLowerCase()
  if (lower.includes('user rejected') || lower.includes('rejected by user')) {
    return 'Request rejected in the wallet. Nothing was submitted.'
  }
  if (lower.includes('insufficient')) {
    return 'Insufficient STRK (or fee token) on Sepolia for this amount + gas. Top up the wallet and retry.'
  }
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw
}

function formatStrkAmount(raw, decimals = 18) {
  let s = BigInt(raw).toString()
  if (s.length <= decimals) s = s.padStart(decimals + 1, '0')
  const whole = s.slice(0, s.length - decimals) || '0'
  const frac = s.slice(s.length - decimals).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}

// Mirror of lib/wallet.js chain-id normalization (kept dependency-free).
function feltToAscii(hex) {
  let h = hex.slice(2)
  if (h.length % 2) h = `0${h}`
  let out = ''
  for (let i = 0; i < h.length; i += 2) {
    const code = parseInt(h.slice(i, i + 2), 16)
    if (code) out += String.fromCharCode(code)
  }
  return out
}

function normalizeChainId(value) {
  if (value == null) return null
  const s = String(value).trim()
  if (!s) return null
  if (/^0x[0-9a-fA-F]+$/.test(s)) {
    const ascii = feltToAscii(s.toLowerCase())
    return /^[\x20-\x7e]+$/.test(ascii) ? ascii.toUpperCase() : s.toLowerCase()
  }
  if (/^\d+$/.test(s)) {
    try {
      const ascii = feltToAscii(`0x${BigInt(s).toString(16)}`)
      return /^[\x20-\x7e]+$/.test(ascii) ? ascii.toUpperCase() : s
    } catch {
      return s
    }
  }
  return s.toUpperCase()
}

const SEPOLIA_HEX = '0x534e5f5345504f4c4941'
function isSepoliaChain(value) {
  if (value == null) return null
  return normalizeChainId(value) === normalizeChainId(SEPOLIA_HEX)
}

const cases = [
  [formatWalletError({ code: 'NO_STRK20', message: 'x' }).includes('Fund publicly'), 'NO_STRK20'],
  [formatWalletError({ message: 'User rejected the request' }).includes('rejected'), 'reject'],
  [formatWalletError({ message: 'insufficient funds' }).includes('Insufficient'), 'balance'],
  [formatStrkAmount(10n ** 17n) === '0.1', '0.1 STRK'],
  [formatStrkAmount(5n * 10n ** 18n) === '5', '5 STRK'],
  // chain-id normalization across wallet representations
  [normalizeChainId(SEPOLIA_HEX) === 'SN_SEPOLIA', 'hex -> SN_SEPOLIA'],
  [isSepoliaChain('0x534e5f5345504f4c4941') === true, 'hex felt is Sepolia'],
  [isSepoliaChain('SN_SEPOLIA') === true, 'short string is Sepolia'],
  [isSepoliaChain('sn_sepolia') === true, 'lowercase short string is Sepolia'],
  [isSepoliaChain('393402133025997798000961') === true, 'decimal felt is Sepolia'],
  [isSepoliaChain('0x534e5f4d41494e') === false, 'mainnet is not Sepolia'],
  [isSepoliaChain('SN_MAIN') === false, 'SN_MAIN is not Sepolia'],
  [isSepoliaChain(null) === null, 'null chain id'],
]

let failed = 0
for (const [ok, name] of cases) {
  if (!ok) {
    console.error('FAIL', name)
    failed += 1
  } else {
    console.log('ok', name)
  }
}
if (failed) process.exit(1)
console.log('smoke ok')
