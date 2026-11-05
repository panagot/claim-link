/**
 * Local evidence log for Seed reviewers: last Sepolia fund / claim txs.
 * Stored only in this browser; paste into Seed page / submission notes.
 */

const KEY = 'claimlink-sepolia-evidence-v1'

export function loadEvidence() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"events":[]}')
  } catch {
    return { events: [] }
  }
}

export function recordEvidence(event) {
  const state = loadEvidence()
  state.events.unshift({
    ...event,
    at: event.at || Date.now(),
  })
  state.events = state.events.slice(0, 20)
  localStorage.setItem(KEY, JSON.stringify(state))
  return state
}

export function clearEvidence() {
  localStorage.removeItem(KEY)
}

export function latestByKind(kind) {
  return loadEvidence().events.find((e) => e.kind === kind) || null
}

/** Plaintext blurb for Seed submission paste. Prefers pinned operator proof, falls back to local. */
export function formatSubmissionBlurb(explorerTxFn, operatorProof = null) {
  const fund = latestByKind('fund')
  const claim = latestByKind('claim')
  const lines = ['Claimlink Sepolia evidence', '']

  if (operatorProof?.fundTx || operatorProof?.claimTx) {
    lines.push('Pinned operator proof:')
    lines.push(
      operatorProof.fundTx
        ? `  Fund: ${explorerTxFn('sepolia', operatorProof.fundTx)}`
        : '  Fund: (not pinned)',
    )
    lines.push(
      operatorProof.claimTx
        ? `  Claim: ${explorerTxFn('sepolia', operatorProof.claimTx)}`
        : '  Claim: (not pinned)',
    )
    if (operatorProof.demoVideoUrl) lines.push(`  Demo: ${operatorProof.demoVideoUrl}`)
    lines.push('')
  }

  lines.push('This browser run:')
  if (fund) {
    lines.push(`  Fund (${fund.fundMode || 'public'}): ${explorerTxFn('sepolia', fund.tx)}`)
    lines.push(`    at ${new Date(fund.at).toISOString()}`)
  } else {
    lines.push('  Fund: (none in this browser yet)')
  }
  if (claim) {
    lines.push(`  Claim (${claim.mode || 'claim'}): ${explorerTxFn('sepolia', claim.tx)}`)
    lines.push(`    at ${new Date(claim.at).toISOString()}`)
  } else {
    lines.push('  Claim: (none in this browser yet)')
  }
  lines.push('', 'Path: public fund → claim_to_address. Not audited.')
  return lines.join('\n')
}
