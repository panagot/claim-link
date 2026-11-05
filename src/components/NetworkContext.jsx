import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_NETWORK, NETWORKS } from '../config/networks'
import { appendProbeHistory, loadProbeHistory } from '../lib/probeHistory'
import { probeSepolia } from '../lib/sepolia'

const Ctx = createContext(null)

export function NetworkProvider({ children }) {
  const [networkId, setNetworkId] = useState(() => localStorage.getItem('claimlink-net') || DEFAULT_NETWORK)
  const [health, setHealth] = useState(null)
  const [probing, setProbing] = useState(false)
  const [probeHistory, setProbeHistory] = useState(() => loadProbeHistory())

  const network = NETWORKS[networkId] || NETWORKS.demo

  const refreshHealth = useCallback(async () => {
    if (networkId !== 'sepolia') {
      setHealth(null)
      return
    }
    setProbing(true)
    try {
      const result = await probeSepolia()
      setHealth(result)
      setProbeHistory(appendProbeHistory(result))
    } catch (err) {
      const fail = { ok: false, error: err?.message || String(err), checkedAt: Date.now(), ms: null }
      setHealth(fail)
      setProbeHistory(appendProbeHistory(fail))
    } finally {
      setProbing(false)
    }
  }, [networkId])

  useEffect(() => {
    localStorage.setItem('claimlink-net', networkId)
    refreshHealth()
  }, [networkId, refreshHealth])

  const value = useMemo(
    () => ({
      networkId,
      setNetworkId,
      network,
      health,
      probing,
      refreshHealth,
      probeHistory,
      networks: NETWORKS,
    }),
    [networkId, network, health, probing, refreshHealth, probeHistory],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNetwork() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useNetwork outside provider')
  return v
}
