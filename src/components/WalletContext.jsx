import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { connectWallet, formatWalletError, getInjectedWallet, isSepoliaChain, walletChainId } from '../lib/wallet'

const Ctx = createContext(null)

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [address, setAddress] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [status, setStatus] = useState('idle') // idle | connecting | connected | error
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const [hasWallet, setHasWallet] = useState(false)

  const sync = useCallback(() => {
    const w = getInjectedWallet()
    if (w?.isConnected && w.account) {
      setAccount(w.account)
      setAddress(w.account.address)
      setChainId(walletChainId())
      setStatus('connected')
    }
  }, [])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    setErrorCode(null)
    try {
      const { account: acc, address: addr } = await connectWallet({ requireSepolia: false })
      setAccount(acc)
      setAddress(addr)
      setChainId(walletChainId())
      setStatus('connected')
      return addr
    } catch (e) {
      setError(formatWalletError(e))
      setErrorCode(e?.code || null)
      setStatus('error')
      throw e
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setAddress(null)
    setChainId(null)
    setStatus('idle')
    setError(null)
    setErrorCode(null)
    try {
      getInjectedWallet()?.disconnect?.()
    } catch {
      /* ignore */
    }
  }, [])

  // Silent reconnect if the wallet is already enabled, plus live account/network events.
  // Wallets inject asynchronously, so re-check detection a few times after mount.
  useEffect(() => {
    let tries = 0
    const detect = () => {
      const w = getInjectedWallet()
      setHasWallet(Boolean(w))
      if (w?.isConnected && w.account) sync()
      return Boolean(w)
    }
    if (!detect()) {
      const timer = window.setInterval(() => {
        tries += 1
        if (detect() || tries >= 5) window.clearInterval(timer)
      }, 400)
      return () => window.clearInterval(timer)
    }
    return undefined
  }, [sync])

  useEffect(() => {
    const w = getInjectedWallet()
    if (!w?.on) return undefined
    const onAccounts = () => sync()
    const onNetwork = () => setChainId(walletChainId())
    try {
      w.on('accountsChanged', onAccounts)
      w.on('networkChanged', onNetwork)
    } catch {
      /* ignore */
    }
    return () => {
      try {
        w.off?.('accountsChanged', onAccounts)
        w.off?.('networkChanged', onNetwork)
      } catch {
        /* ignore */
      }
    }
  }, [sync, hasWallet])

  const isSepolia = chainId == null ? null : isSepoliaChain(chainId)

  const value = useMemo(
    () => ({ account, address, chainId, isSepolia, status, error, errorCode, hasWallet, connect, disconnect }),
    [account, address, chainId, isSepolia, status, error, errorCode, hasWallet, connect, disconnect],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWallet() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWallet outside provider')
  return v
}
