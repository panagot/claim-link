const KEY = 'claimlink-probe-history-v1'
const MAX = 20

export function loadProbeHistory() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw.slice(-MAX) : []
  } catch {
    return []
  }
}

export function appendProbeHistory(health) {
  if (!health) return loadProbeHistory()
  const point = {
    ts: health.checkedAt || Date.now(),
    ok: Boolean(health.ok),
    ms: typeof health.ms === 'number' ? health.ms : null,
    blockNumber: health.blockNumber ?? null,
    poolOk: Boolean(health.pool?.ok),
    anonymizerOk: Boolean(health.anonymizer?.ok),
  }
  const next = [...loadProbeHistory(), point].slice(-MAX)
  sessionStorage.setItem(KEY, JSON.stringify(next))
  return next
}
