/**
 * Thin Starknet wallet bridge for Claimlink.
 * Public fund / claim_to_address use ordinary account.execute.
 * Private pool Fund uses STRK20 Wallet API when the wallet exposes it.
 */

import { RpcProvider, WalletAccount } from 'starknet'
import { NETWORKS } from '../config/networks'

/** Recommended Starknet wallets when none is detected. */
export const WALLET_INSTALLS = [
  { id: 'braavos', label: 'Braavos', url: 'https://braavos.app/' },
  { id: 'argentx', label: 'Argent X (Ready)', url: 'https://www.argent.xyz/argent-x/' },
]

/** Pick an injected Starknet wallet across legacy + multi-wallet injection shapes. */
export function getInjectedWallet() {
  if (typeof window === 'undefined') return null
  if (window.starknet) return window.starknet
  if (window.starknet_argentX) return window.starknet_argentX
  if (window.starknet_braavos) return window.starknet_braavos
  // Any other SNIP-compliant injection (window.starknet_*)
  const key = Object.keys(window).find((k) => k.startsWith('starknet_') && window[k]?.enable)
  return key ? window[key] : null
}

export function hasInjectedWallet() {
  return Boolean(getInjectedWallet())
}

export function hasStrk20Wallet(account) {
  return Boolean(account && typeof account.strk20InvokeTransaction === 'function')
}

/** Map wallet / RPC failures into short reviewer-facing copy. */
export function formatWalletError(err) {
  if (!err) return 'Unknown wallet error'
  if (err.code === 'NO_STRK20') {
    return 'This wallet has no STRK20 privacy API. Use Fund publicly (any Argent X / Braavos), or a STRK20-capable privacy wallet.'
  }
  if (err.code === 'WRONG_NETWORK') {
    return err.message || 'Switch the wallet to Starknet Sepolia, then retry.'
  }
  if (err.code === 'NO_WALLET') {
    return 'No Starknet wallet detected. Install Braavos or Argent X (Ready), unlock it, then retry.'
  }
  if (err.code === 'NO_ACCOUNT') {
    return err.message || 'Wallet exposed no account. Unlock it and pick an account, then retry.'
  }
  const raw = String(err.message || err || '')
  const lower = raw.toLowerCase()
  if (
    lower.includes('user rejected') ||
    lower.includes('user abort') ||
    lower.includes('user refused') ||
    lower.includes('rejected by user') ||
    lower.includes('cancelled') ||
    lower.includes('canceled')
  ) {
    return 'Request rejected in the wallet. Nothing was submitted.'
  }
  if (lower.includes('insufficient') || lower.includes('exceeds balance') || lower.includes('not enough')) {
    return 'Insufficient STRK (or fee token) on Sepolia for this amount + gas. Top up the wallet and retry.'
  }
  if (lower.includes('network') || lower.includes('chain id') || lower.includes('sepolia')) {
    return 'Wallet network looks wrong. Switch to Starknet Sepolia and retry.'
  }
  if (lower.includes('no starknet wallet') || lower.includes('not detected')) {
    return 'No Starknet wallet detected. Install Argent X or Braavos, unlock it, then retry.'
  }
  if (lower.includes('timeout') || lower.includes('failed to fetch') || lower.includes('network error')) {
    return 'RPC or wallet bridge timed out. Check connection and retry.'
  }
  // Keep short; avoid dumping huge Cairo traces into the flash banner
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw
}

function chainIdOf(wallet, account) {
  return (
    wallet?.chainId ||
    wallet?.provider?.chainId ||
    account?.channel?.chainId ||
    account?.provider?.chainId ||
    null
  )
}

/** Decode a hex felt (e.g. 0x534e5f5345504f4c4941) into its ASCII short string. */
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

/**
 * Normalize a Starknet chain id to a canonical short-string form.
 * Wallets differ: some return the hex felt (0x534e5f5345504f4c4941),
 * some the decoded short string (SN_SEPOLIA), some a decimal felt.
 */
export function normalizeChainId(value) {
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

/** True when a wallet-reported chain id matches Starknet Sepolia, in any format. */
export function isSepoliaChain(value) {
  if (value == null) return null
  return normalizeChainId(value) === normalizeChainId(NETWORKS.sepolia.chainId)
}

/** Request accounts via the SNIP standard, falling back to legacy enable(). */
async function requestAccounts(wallet) {
  let accounts = null
  if (typeof wallet.request === 'function') {
    try {
      accounts = await wallet.request({ type: 'wallet_requestAccounts' })
    } catch {
      /* fall back to enable */
    }
  }
  if ((!accounts || !accounts.length) && typeof wallet.enable === 'function') {
    try {
      accounts = await wallet.enable()
    } catch {
      accounts = await wallet.enable({ starknetVersion: 'v5' })
    }
  }
  return accounts
}

/** Connect Argent X / Ready / Braavos (or compatible) injected wallet. */
export async function connectWallet({ requireSepolia = false } = {}) {
  const wallet = getInjectedWallet()
  if (!wallet) {
    const err = new Error('No Starknet wallet detected. Install Braavos or Argent X (Ready), then retry.')
    err.code = 'NO_WALLET'
    throw err
  }

  // Modern path: wrap the injected provider with a starknet.js WalletAccount.
  // This works across legacy get-starknet objects and SNIP-standard injections,
  // where `wallet.account` is often missing or lacks a usable execute().
  const provider = new RpcProvider({ nodeUrl: NETWORKS.sepolia.rpcUrl })
  let account = null
  try {
    account = await WalletAccount.connect(provider, wallet)
  } catch (connectErr) {
    // Legacy fallback: enable() then reuse the wallet's own account.
    try {
      await requestAccounts(wallet)
      if (wallet.account?.execute) account = wallet.account
    } catch {
      /* ignore; rethrow original below */
    }
    if (!account) {
      const msg = String(connectErr?.message || '').toLowerCase()
      if (msg.includes('reject') || msg.includes('abort') || msg.includes('cancel')) throw connectErr
      const err = new Error('Wallet did not expose an account. Unlock it, pick an account, then retry.')
      err.code = 'NO_ACCOUNT'
      throw err
    }
  }

  const address = account?.address || wallet.selectedAddress || null
  if (!account || !address) {
    const err = new Error('Wallet did not expose an account. Unlock it, pick an account, then retry.')
    err.code = 'NO_ACCOUNT'
    throw err
  }

  if (requireSepolia) {
    const got = chainIdOf(wallet, account)
    if (got != null && isSepoliaChain(got) === false) {
      // Best-effort switch; wallets differ
      try {
        if (typeof wallet.request === 'function') {
          await wallet.request({
            type: 'wallet_switchStarknetChain',
            params: { chainId: NETWORKS.sepolia.chainId },
          })
        }
      } catch {
        /* fall through to check */
      }
      const again = chainIdOf(wallet, account)
      if (again != null && isSepoliaChain(again) === false) {
        const err = new Error('Switch the wallet network to Starknet Sepolia, then retry.')
        err.code = 'WRONG_NETWORK'
        throw err
      }
    }
  }

  return { wallet, account, address: account.address || address }
}

/** Execute ordinary Cairo calls (approve + public fund, claim_to_address). */
export async function executeCalls(calls, { requireSepolia = true } = {}) {
  const { account, address } = await connectWallet({ requireSepolia })
  const normalized = calls.map((c) => ({
    contractAddress: c.contractAddress,
    entrypoint: c.entrypoint,
    calldata: c.calldata,
  }))
  const result = await account.execute(normalized)
  return {
    address,
    transaction_hash: result.transaction_hash || result.transactionHash || result,
  }
}

/**
 * Submit STRK20 action list when the wallet implements the privacy API.
 * Falls back with a clear error so the UI can offer the public path.
 */
export async function executeStrk20Actions(actions, { requireSepolia = true } = {}) {
  const { wallet, account, address } = await connectWallet({ requireSepolia })
  // Privacy API lives on the wallet's own injected account when present.
  const privacyAccount = hasStrk20Wallet(wallet?.account) ? wallet.account : account
  if (!hasStrk20Wallet(privacyAccount)) {
    const err = new Error(
      'Connected wallet has no STRK20 privacy API. Use public fund (any wallet) or a STRK20-capable privacy wallet.',
    )
    err.code = 'NO_STRK20'
    throw err
  }
  const result = await privacyAccount.strk20InvokeTransaction(actions)
  return {
    address,
    transaction_hash: result.transaction_hash || result.transactionHash || result,
  }
}

/** Current wallet chain id, best-effort across wallet shapes. */
export function walletChainId() {
  const w = getInjectedWallet()
  if (!w) return null
  return (
    w.chainId ||
    w.provider?.chainId ||
    w.account?.channel?.chainId ||
    w.account?.provider?.chainId ||
    null
  )
}

/** Ask the wallet to switch to Starknet Sepolia. Best-effort; wallets differ. */
export async function switchWalletToSepolia() {
  const wallet = getInjectedWallet()
  if (!wallet) throw new Error('No Starknet wallet detected.')
  if (typeof wallet.request === 'function') {
    await wallet.request({
      type: 'wallet_switchStarknetChain',
      params: { chainId: NETWORKS.sepolia.chainId },
    })
  }
}

/** Parse human STRK amount to 18-decimal bigint. */
export function parseTokenAmount(human, decimals = 18) {
  const s = String(human || '').trim()
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('Invalid amount')
  const [whole, frac = ''] = s.split('.')
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(whole + padded)
}
