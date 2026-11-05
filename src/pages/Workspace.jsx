import { useEffect, useMemo, useState } from 'react'
import {
  buildClaimToAddressCall,
  buildClaimToNoteActions,
  buildFundActions,
  buildPublicFundCalls,
  buildRefundActions,
  decodeLinkFragment,
  decodeRefundFragment,
  encodeClaimLink,
  encodeRefundLink,
  generateEnvelopeKey,
  readEnvelope,
  resolveOpenNoteId,
} from 'strk20-envelope'
import DonutChart from '../components/charts/DonutChart'
import Tooltip from '../components/Tooltip'
import { useNetwork } from '../components/NetworkContext'
import {
  commitmentHash,
  decodeClaimLinkFragment,
  encodeClaimLink as encodeDemoLink,
  generateClaimKey,
  importClaimKey,
  importPublicKey,
  randomId,
  signClaim,
  verifyClaim,
} from '../lib/crypto'
import {
  clearLedger,
  createEnvelope,
  envelopeStatus,
  getByCommitment,
  getEnvelope,
  listEnvelopes,
  markClaimed,
  markRefunded,
} from '../lib/ledger'
import {
  explorerContract,
  explorerTx,
  formatStrkAmount,
  getProvider,
  readSepoliaEnvelopeFromFragment,
  waitForSepoliaTxOutcome,
} from '../lib/sepolia'
import { recordEvidence } from '../lib/evidence'
import {
  connectWallet,
  executeCalls,
  executeStrk20Actions,
  formatWalletError,
  hasInjectedWallet,
  hasStrk20Wallet,
  parseTokenAmount,
} from '../lib/wallet'

const EXPIRY_OPTIONS = [
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
]

const KEYS_STORAGE = 'claimlink-sepolia-keys'

function formatAmount(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  return x.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

function formatWhen(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function loadSepoliaKeys() {
  try {
    const rows = JSON.parse(localStorage.getItem(KEYS_STORAGE) || '[]')
    // Scrub legacy plaintext key material if an older build stored it.
    let dirty = false
    const cleaned = rows.map((r) => {
      if (!r.claimPrivateKey && !r.refundPrivateKey) return r
      dirty = true
      const { claimPrivateKey: _c, refundPrivateKey: _r, ...rest } = r
      return rest
    })
    if (dirty) localStorage.setItem(KEYS_STORAGE, JSON.stringify(cleaned))
    return cleaned
  } catch {
    return []
  }
}

function appBaseUrl() {
  return `${window.location.origin}/app`
}

/** Persist links only — private keys live in the URL fragments, not a second plaintext copy. */
function saveSepoliaKey(row) {
  const safe = {
    claimPublicKey: row.claimPublicKey,
    refundPublicKey: row.refundPublicKey,
    amount: row.amount,
    expiry: row.expiry,
    memo: row.memo,
    createdAt: row.createdAt,
    claimLink: row.claimLink,
    refundLink: row.refundLink,
    funded: row.funded,
    fundMode: row.fundMode,
    fundTx: row.fundTx,
    funder: row.funder,
  }
  const prev = loadSepoliaKeys()
  prev.unshift(safe)
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(prev.slice(0, 30)))
}

function updateSepoliaKey(claimPublicKey, patch) {
  const prev = loadSepoliaKeys()
  const next = prev.map((r) => (r.claimPublicKey === claimPublicKey ? { ...r, ...patch } : r))
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(next))
}

function initialWorkspaceTab() {
  const path = typeof window !== 'undefined' ? window.location.pathname : ''
  if (path.includes('/claim') || path.includes('/refund') || (typeof window !== 'undefined' && window.location.hash)) {
    return 'claim'
  }
  return 'create'
}

export default function Workspace() {
  const { network, setNetworkId } = useNetwork()
  const [tab, setTab] = useState(initialWorkspaceTab)
  const [flash, setFlash] = useState(null)
  const [rows, setRows] = useState([])
  const [claimPaste, setClaimPaste] = useState(() => window.location.hash || '')

  const refresh = () => setRows(listEnvelopes())
  useEffect(() => {
    refresh()
  }, [])

  // Envelope deep links / pasted fragments need Sepolia reads — nudge out of Demo.
  useEffect(() => {
    if (network.live) return
    const path = window.location.pathname || ''
    const hash = window.location.hash || ''
    if (path.includes('/claim') || path.includes('/refund') || hash.includes('e1.') || hash.includes('r1.')) {
      setNetworkId('sepolia')
      setTab('claim')
      setClaimPaste(hash || claimPaste)
      setFlash({
        kind: 'ok',
        text: 'Switched to Sepolia for Envelope link handling. Demo ledger cannot read on-chain envelopes.',
      })
      window.setTimeout(() => setFlash(null), 7000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep-link nudge
  }, [network.live, setNetworkId])

  const show = (kind, text) => {
    setFlash({ kind, text })
    window.setTimeout(() => setFlash(null), 7000)
  }

  const openAsRecipient = (claimLink) => {
    setClaimPaste(claimLink)
    setTab('claim')
    try {
      const u = new URL(claimLink)
      window.history.replaceState(null, '', `${u.pathname}${u.hash}`)
    } catch {
      /* ignore */
    }
    show('ok', 'Claim tab opened with your link. Read on-chain, then claim_to_address.')
  }

  return (
    <main className="page workspace">
      <header className="page-head">
        <div>
          <p className="eyebrow">Application</p>
          <h1>Claim workspace</h1>
          <p className="page-lede">
            {network.live
              ? 'Sepolia default: public fund → claim_to_address (any wallet). Private pool Fund / claim-to-note only if a STRK20 Wallet API is present.'
              : 'Demo mode runs a full local escrow loop so reviewers can click through without wallets.'}
          </p>
        </div>
        <div className="mode-card">
          <span className="k">
            <Tooltip
              title="Active mode"
              body={
                network.live
                  ? 'Sepolia: public fund + claim_to_address work with ordinary wallets. Private pool Fund needs a STRK20 privacy wallet.'
                  : 'Demo: full local create, claim, and refund loop in this browser.'
              }
            >
              Active mode
            </Tooltip>
          </span>
          <strong>{network.label}</strong>
          <span className="muted">{network.description}</span>
        </div>
      </header>

      {flash ? <div className={`flash ${flash.kind}`}>{flash.text}</div> : null}

      <nav className="subtabs" aria-label="Workspace">
        {[
          ['create', 'Create'],
          ['claim', 'Open link'],
          ['ledger', network.live ? 'Keys & backup' : 'Demo ledger'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'create' ? (
        network.live ? (
          <SepoliaCreate onFlash={show} network={network} onOpenAsRecipient={openAsRecipient} />
        ) : (
          <DemoCreate
            onCreated={() => {
              refresh()
              show('ok', 'Demo claim link ready. Fragment is a bearer instrument.')
            }}
            onError={(e) => show('err', e.message || String(e))}
          />
        )
      ) : null}

      {tab === 'claim' ? (
        network.live ? (
          <SepoliaClaim
            onFlash={show}
            network={network}
            paste={claimPaste}
            setPaste={setClaimPaste}
          />
        ) : (
          <DemoClaim
            onDone={() => {
              refresh()
              show('ok', 'Claim recorded in the demo ledger.')
            }}
            onError={(e) => show('err', e.message || String(e))}
          />
        )
      ) : null}

      {tab === 'ledger' ? (
        network.live ? (
          <SepoliaNotes onFlash={show} network={network} />
        ) : (
          <DemoLedger
            rows={rows}
            onRefresh={refresh}
            onClear={() => {
              clearLedger()
              refresh()
              show('ok', 'Demo ledger cleared.')
            }}
            onRefund={(id) => {
              try {
                markRefunded(id, { refundedAt: Date.now() })
                refresh()
                show('ok', 'Refund recorded.')
              } catch (e) {
                show('err', e.message || String(e))
              }
            }}
          />
        )
      ) : null}
    </main>
  )
}

function SepoliaCreate({ onFlash, network, onOpenAsRecipient }) {
  const [amount, setAmount] = useState('0.1')
  const [expiryHours, setExpiryHours] = useState(24)
  const [memo, setMemo] = useState('claimlink')
  const [busy, setBusy] = useState(null)
  const [result, setResult] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [backedUp, setBackedUp] = useState(false)
  const [cashAck, setCashAck] = useState(false)
  const [chainStatus, setChainStatus] = useState(null)

  const create = async () => {
    setBusy('create')
    setTxHash(null)
    setBackedUp(false)
    try {
      const amt = Number(amount)
      if (!(amt > 0) || !Number.isFinite(amt)) throw new Error('Amount must be a positive number')
      parseTokenAmount(String(amount).trim())
      const claim = generateEnvelopeKey()
      const refund = generateEnvelopeKey()
      const base = appBaseUrl()
      const claimLink = encodeClaimLink(base, claim.privateKey)
      const refundLink = encodeRefundLink(base, refund.privateKey, claim.publicKey)
      const expiry = Math.floor(Date.now() / 1000) + expiryHours * 3600
      const packet = {
        network: 'sepolia',
        amount,
        token: 'STRK',
        claimPublicKey: claim.publicKey,
        refundPublicKey: refund.publicKey,
        claimPrivateKey: claim.privateKey,
        refundPrivateKey: refund.privateKey,
        expiry,
        claimLink,
        refundLink,
        anonymizer: network.anonymizer,
        pool: network.pool,
        strk: network.strk,
        memo: (memo || 'claimlink').slice(0, 31),
        createdAt: Date.now(),
        funded: false,
        fundMode: null,
      }
      saveSepoliaKey(packet)
      setResult(packet)
      setCashAck(false)
      setChainStatus(null)
      onFlash(
        'ok',
        'Links sealed. Back up the refund link, then Fund publicly (default). Private fund only if your wallet has a STRK20 API.',
      )
    } catch (e) {
      onFlash('err', formatWalletError(e))
    } finally {
      setBusy(null)
    }
  }

  const refreshChain = async (packet = result) => {
    if (!packet?.claimPublicKey) return null
    try {
      const provider = getProvider('sepolia')
      const state = await readEnvelope(provider, packet.anonymizer, packet.claimPublicKey)
      setChainStatus(state)
      return state
    } catch (e) {
      onFlash('err', formatWalletError(e))
      return null
    }
  }

  const copyClaimLink = async () => {
    if (!result) return
    if (!cashAck) {
      onFlash('err', 'Confirm the bearer warning before copying the claim link. Treat it like cash.')
      return
    }
    await navigator.clipboard.writeText(result.claimLink)
    onFlash('ok', 'Claim link copied. Anyone with it can attempt a claim.')
  }

  const fundPublic = async () => {
    if (!result) return
    if (!backedUp) {
      onFlash('err', 'Confirm you backed up the refund link before funding.')
      return
    }
    setBusy('public')
    try {
      const amountWei = parseTokenAmount(result.amount)
      const calls = buildPublicFundCalls({
        anonymizer: result.anonymizer,
        token: result.strk,
        amount: amountWei,
        claimPublicKey: result.claimPublicKey,
        refundPublicKey: result.refundPublicKey,
        expiry: result.expiry,
        memo: result.memo,
      })
      const { transaction_hash, address } = await executeCalls(calls)
      setTxHash(transaction_hash)
      onFlash('ok', 'Public fund submitted. Waiting for Sepolia confirmation…')
      const outcome = await waitForSepoliaTxOutcome(transaction_hash)
      if (outcome.status === 'failed') {
        onFlash('err', formatWalletError(outcome.error))
        return
      }
      const state = await refreshChain({ ...result, anonymizer: result.anonymizer })
      const onChainFunded = state?.status === 'funded' || state?.status === 'claimed'
      if (outcome.status === 'timeout' && !onChainFunded) {
        onFlash(
          'err',
          'Submitted but confirmation timed out. Check the explorer, then Refresh on-chain status before sharing.',
        )
        return
      }
      updateSepoliaKey(result.claimPublicKey, {
        funded: true,
        fundMode: 'public',
        fundTx: transaction_hash,
        funder: address,
      })
      setResult((r) => ({ ...r, funded: true, fundMode: 'public', fundTx: transaction_hash }))
      recordEvidence({
        kind: 'fund',
        fundMode: 'public',
        tx: transaction_hash,
        claimPublicKey: result.claimPublicKey,
        amount: result.amount,
        funder: address,
      })
      onFlash(
        'ok',
        outcome.status === 'timeout'
          ? 'On-chain status shows funded after timeout. Share the claim link.'
          : 'Public fund confirmed on-chain. Share the claim link.',
      )
    } catch (e) {
      onFlash('err', formatWalletError(e))
    } finally {
      setBusy(null)
    }
  }

  const fundPrivate = async () => {
    if (!result) return
    if (!backedUp) {
      onFlash('err', 'Confirm you backed up the refund link before funding.')
      return
    }
    setBusy('private')
    try {
      const amountWei = parseTokenAmount(result.amount)
      const actions = buildFundActions({
        anonymizer: result.anonymizer,
        token: result.strk,
        amount: amountWei,
        claimPublicKey: result.claimPublicKey,
        refundPublicKey: result.refundPublicKey,
        expiry: result.expiry,
        memo: result.memo,
        fundFrom: 'wallet',
      })
      const { transaction_hash, address } = await executeStrk20Actions(actions)
      setTxHash(transaction_hash)
      onFlash('ok', 'Private fund submitted. Waiting for confirmation…')
      const outcome = await waitForSepoliaTxOutcome(transaction_hash)
      if (outcome.status === 'failed') {
        onFlash('err', formatWalletError(outcome.error))
        return
      }
      const state = await refreshChain(result)
      const onChainFunded = state?.status === 'funded' || state?.status === 'claimed'
      if (outcome.status === 'timeout' && !onChainFunded) {
        onFlash(
          'err',
          'Submitted but confirmation timed out. Check the explorer, then Refresh on-chain status.',
        )
        return
      }
      updateSepoliaKey(result.claimPublicKey, {
        funded: true,
        fundMode: 'private',
        fundTx: transaction_hash,
        funder: address,
      })
      setResult((r) => ({ ...r, funded: true, fundMode: 'private', fundTx: transaction_hash }))
      recordEvidence({
        kind: 'fund',
        fundMode: 'private',
        tx: transaction_hash,
        claimPublicKey: result.claimPublicKey,
        amount: result.amount,
        funder: address,
      })
      onFlash(
        'ok',
        outcome.status === 'timeout'
          ? 'On-chain status shows funded after timeout.'
          : 'Private fund confirmed on-chain.',
      )
    } catch (e) {
      onFlash('err', formatWalletError(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Seal &amp; fund on Sepolia</h2>
        <p>
          Reviewer default:{' '}
          <Tooltip
            title="Public fund"
            body="Approve STRK + fund on the anonymizer. Funder identity is visible. Claim binding and expiry remain. Works with Argent X / Braavos."
          >
            Fund publicly
          </Tooltip>{' '}
          → share claim link → recipient claim_to_address. Private fund is optional and only works with a STRK20
          Wallet API.
        </p>
      </div>
      <div className="form-grid">
        <label>
          <span>
            <Tooltip label="Amounts are public on the funding and claim legs. Prefer round denominations.">
              Amount (STRK)
            </Tooltip>
          </span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label>
          <span>Expiry (hours)</span>
          <input
            type="number"
            min={1}
            value={expiryHours}
            onChange={(e) => setExpiryHours(Number(e.target.value) || 24)}
          />
        </label>
        <label className="wide">
          <span>Memo (≤31 chars, on-chain)</span>
          <input value={memo} maxLength={31} onChange={(e) => setMemo(e.target.value)} />
        </label>
      </div>
      <button type="button" className="btn primary" disabled={Boolean(busy)} onClick={create}>
        {busy === 'create' ? 'Generating…' : 'Generate claim + refund links'}
      </button>

      {result ? (
        <div className="result stack">
          <div className="callout warn">
            <strong>Back up before funding.</strong> The refund link is recovery after expiry. Store it offline.
            Losing it can strand value. Public-path expiry refund still needs a STRK20 privacy wallet (SDK).
          </div>
          <dl className="facts">
            <div>
              <dt>Claim pubkey</dt>
              <dd>
                <code>{result.claimPublicKey}</code>
              </dd>
            </div>
            <div>
              <dt>Anonymizer</dt>
              <dd>
                <a href={explorerContract('sepolia', result.anonymizer)} target="_blank" rel="noreferrer">
                  {result.anonymizer}
                </a>
              </dd>
            </div>
            <div>
              <dt>Expiry</dt>
              <dd>{formatWhen(result.expiry * 1000)}</dd>
            </div>
            <div>
              <dt>Local</dt>
              <dd>
                {result.funded ? (
                  <strong className="pill funded">{result.fundMode || 'funded'}</strong>
                ) : (
                  <span className="pill open">unfunded</span>
                )}
              </dd>
            </div>
            <div>
              <dt>On-chain</dt>
              <dd>
                {chainStatus ? (
                  <strong className={`pill ${chainStatus.status}`}>{chainStatus.status}</strong>
                ) : (
                  <span className="muted">not read yet</span>
                )}
              </dd>
            </div>
          </dl>
          <label className="wide">
            <span>Claim link (bearer instrument)</span>
            <textarea readOnly rows={3} value={result.claimLink} />
          </label>
          <label className="wide">
            <span>Refund link (keep private)</span>
            <textarea readOnly rows={3} value={result.refundLink} />
          </label>
          <label className="backup-confirm">
            <input type="checkbox" checked={cashAck} onChange={(e) => setCashAck(e.target.checked)} />
            <span>I understand the claim link is cash — anyone with it can attempt a claim</span>
          </label>
          <div className="row-actions">
            <button type="button" onClick={copyClaimLink}>
              Copy claim link
            </button>
            <button type="button" onClick={() => navigator.clipboard.writeText(result.refundLink)}>
              Copy refund link
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob(
                  [
                    JSON.stringify(
                      {
                        network: 'sepolia',
                        amount: result.amount,
                        claimPublicKey: result.claimPublicKey,
                        refundPublicKey: result.refundPublicKey,
                        claimLink: result.claimLink,
                        refundLink: result.refundLink,
                        expiry: result.expiry,
                        memo: result.memo,
                        createdAt: result.createdAt,
                      },
                      null,
                      2,
                    ),
                  ],
                  { type: 'application/json' },
                )
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `claimlink-backup-${result.claimPublicKey.slice(2, 10)}.json`
                a.click()
                URL.revokeObjectURL(a.href)
              }}
            >
              Download backup JSON
            </button>
          </div>
          <label className="backup-confirm">
            <input type="checkbox" checked={backedUp} onChange={(e) => setBackedUp(e.target.checked)} />
            <span>I saved the refund link / backup JSON offline</span>
          </label>
          <div className="row-actions fund-actions">
            <button
              type="button"
              className="btn primary"
              disabled={Boolean(busy) || result.funded || !backedUp}
              onClick={fundPublic}
            >
              {busy === 'public' ? 'Submitting…' : 'Fund publicly (any wallet)'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={Boolean(busy) || result.funded || !backedUp}
              title="Requires a wallet that implements strk20InvokeTransaction. Most Argent X / Braavos installs do not."
              onClick={fundPrivate}
            >
              {busy === 'private' ? 'Submitting…' : 'Fund privately (needs STRK20 API)'}
            </button>
          </div>
          <p className="muted">
            Private fund fails fast with a clear error if the connected wallet has no STRK20 API — use public
            fund for Seed demos.
          </p>
          {!hasInjectedWallet() ? (
            <p className="muted">No Starknet wallet detected in this browser. Install Argent X or Braavos.</p>
          ) : null}
          {txHash ? (
            <p>
              Fund tx:{' '}
              <a href={explorerTx('sepolia', txHash)} target="_blank" rel="noreferrer">
                {txHash}
              </a>
            </p>
          ) : null}
          {result.funded ? (
            <div className="callout">
              <strong>Next:</strong> confirm the claim warning → copy claim link → Open link tab → claim_to_address.
              <div className="row-actions" style={{ marginTop: '0.75rem' }}>
                <button type="button" disabled={Boolean(busy)} onClick={() => refreshChain()}>
                  Refresh on-chain status
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => onOpenAsRecipient?.(result.claimLink)}
                >
                  Open as recipient
                </button>
              </div>
            </div>
          ) : null}
          <p className="muted">
            Second opinion:{' '}
            <a href={network.referenceApp} target="_blank" rel="noreferrer">
              Envelope reference app
            </a>
            . Evidence also appears on the Seed page after fund/claim.
          </p>
        </div>
      ) : null}
    </section>
  )
}

function SepoliaClaim({ onFlash, network, paste, setPaste }) {
  const [busy, setBusy] = useState(null)
  const [view, setView] = useState(null)
  const [recipient, setRecipient] = useState('')
  const [txHash, setTxHash] = useState(null)

  const load = async () => {
    const src = (paste.trim() || window.location.hash || '').trim()
    if (!src) {
      onFlash('err', 'Paste a claim or refund link first (it looks like …/app#/claim/… or #/refund/…).')
      return
    }
    if (!/#?\/?(claim|refund)\//.test(src) && !/#(e1\.|r1\.)/.test(src)) {
      onFlash('err', 'That does not look like a Claimlink claim or refund link. Check you copied the whole URL.')
      return
    }
    setBusy('read')
    setView(null)
    setTxHash(null)
    try {
      let fragment = src
      try {
        fragment = new URL(src).hash || src
      } catch {
        /* fragment string */
      }
      const refundDecoded = decodeRefundFragment(fragment)
      if (refundDecoded) {
        const provider = getProvider('sepolia')
        const state = await readEnvelope(provider, network.anonymizer, refundDecoded.claimPublicKey)
        setView({
          kind: 'refund',
          claimPublicKey: refundDecoded.claimPublicKey,
          refundPrivateKey: refundDecoded.refundPrivateKey,
          privateKey: refundDecoded.refundPrivateKey,
          state,
        })
        onFlash('ok', `Refund link · on-chain status: ${state.status}`)
        return
      }
      const decoded = decodeLinkFragment(fragment)
      if (!decoded) throw new Error('Could not decode Envelope claim or refund fragment')
      const data = await readSepoliaEnvelopeFromFragment(fragment)
      setView({
        ...data,
        privateKey: decoded.privateKey,
        kind: decoded.kind,
      })
      onFlash('ok', `On-chain status: ${data.state.status}`)
    } catch (e) {
      onFlash('err', formatWalletError(e))
    } finally {
      setBusy(null)
    }
  }

  const claimToAddress = async () => {
    if (!view?.privateKey || view.kind === 'refund') return
    const typed = recipient.trim()
    if (typed && !/^0x[0-9a-fA-F]{1,64}$/.test(typed)) {
      onFlash('err', 'Recipient must be a Starknet address (0x…). Clear it to use your connected wallet.')
      return
    }
    setBusy('claim-addr')
    try {
      let to = typed
      if (!to) {
        const { address } = await connectWallet({ requireSepolia: true })
        to = address
        setRecipient(address)
      }
      const call = buildClaimToAddressCall({
        anonymizer: network.anonymizer,
        claimPrivateKey: view.privateKey,
        claimPublicKey: view.claimPublicKey,
        recipient: to,
      })
      const { transaction_hash } = await executeCalls([call])
      setTxHash(transaction_hash)
      onFlash('ok', 'claim_to_address submitted. Waiting for confirmation…')
      const outcome = await waitForSepoliaTxOutcome(transaction_hash)
      if (outcome.status === 'failed') {
        onFlash('err', formatWalletError(outcome.error))
        return
      }
      await load()
      if (outcome.status === 'timeout' && view?.state?.status !== 'claimed') {
        // load() refreshed view asynchronously via setState — re-read for truth
        try {
          const data = await readSepoliaEnvelopeFromFragment(
            paste.includes('#') ? paste.slice(paste.indexOf('#')) : paste,
          )
          if (data?.state?.status !== 'claimed') {
            onFlash(
              'err',
              'Submitted but confirmation timed out. Re-read on-chain status or check the explorer.',
            )
            return
          }
        } catch {
          onFlash(
            'err',
            'Submitted but confirmation timed out. Re-read on-chain status or check the explorer.',
          )
          return
        }
      }
      recordEvidence({
        kind: 'claim',
        mode: 'claim_to_address',
        tx: transaction_hash,
        claimPublicKey: view.claimPublicKey,
        recipient: to,
      })
      onFlash(
        'ok',
        outcome.status === 'timeout'
          ? 'On-chain status shows claimed after timeout.'
          : 'claim_to_address confirmed on-chain.',
      )
    } catch (e) {
      onFlash('err', formatWalletError(e))
    } finally {
      setBusy(null)
    }
  }

  const claimToNote = async () => {
    if (!view?.privateKey || view.kind === 'refund') return
    setBusy('claim-note')
    try {
      const { account, address } = await connectWallet({ requireSepolia: true })
      if (!hasStrk20Wallet(account)) {
        throw Object.assign(new Error('No STRK20 privacy API. Use claim_to_address for publicly funded envelopes.'), {
          code: 'NO_STRK20',
        })
      }
      const token = view.state.token
      const probe = buildClaimToNoteActions({
        anonymizer: network.anonymizer,
        claimPrivateKey: view.privateKey,
        claimPublicKey: view.claimPublicKey,
        token,
        recipient: address,
        noteId: '',
      })
      if (typeof account.strk20PrepareInvoke !== 'function') {
        throw new Error('Wallet lacks strk20PrepareInvoke; cannot resolve open note id.')
      }
      const noteId = await resolveOpenNoteId(account, probe, view.claimPublicKey)
      if (!noteId) throw new Error('Could not resolve open note id from wallet prepare')
      const actions = buildClaimToNoteActions({
        anonymizer: network.anonymizer,
        claimPrivateKey: view.privateKey,
        claimPublicKey: view.claimPublicKey,
        token,
        recipient: address,
        noteId,
      })
      const result = await account.strk20InvokeTransaction(actions)
      const hash = result.transaction_hash || result.transactionHash || result
      setTxHash(hash)
      onFlash('ok', 'Private claim-to-note submitted. Waiting for confirmation…')
      const outcome = await waitForSepoliaTxOutcome(hash)
      if (outcome.status === 'failed') {
        onFlash('err', formatWalletError(outcome.error))
        return
      }
      await load()
      if (outcome.status === 'timeout') {
        onFlash(
          'err',
          'Submitted but confirmation timed out. Re-read on-chain state or check the explorer.',
        )
        return
      }
      recordEvidence({
        kind: 'claim',
        mode: 'claim_to_note',
        tx: hash,
        claimPublicKey: view.claimPublicKey,
        recipient: address,
      })
      onFlash('ok', 'Private claim-to-note confirmed on-chain.')
    } catch (e) {
      onFlash('err', formatWalletError(e))
    } finally {
      setBusy(null)
    }
  }

  const refundPrivate = async () => {
    if (!view || view.kind !== 'refund') return
    setBusy('refund')
    try {
      const { account, address } = await connectWallet({ requireSepolia: true })
      if (!hasStrk20Wallet(account)) {
        throw Object.assign(
          new Error(
            'Refund-to-note needs a STRK20 privacy wallet. Keep this refund link; public-path expiry recovery is Wallet-API gated in the SDK.',
          ),
          { code: 'NO_STRK20' },
        )
      }
      const token = view.state.token
      const probe = buildRefundActions({
        anonymizer: network.anonymizer,
        refundPrivateKey: view.refundPrivateKey,
        claimPublicKey: view.claimPublicKey,
        token,
        recipient: address,
        noteId: '',
      })
      if (typeof account.strk20PrepareInvoke !== 'function') {
        throw new Error('Wallet lacks strk20PrepareInvoke; cannot resolve open note id for refund.')
      }
      const noteId = await resolveOpenNoteId(account, probe, view.claimPublicKey)
      if (!noteId) throw new Error('Could not resolve open note id')
      const actions = buildRefundActions({
        anonymizer: network.anonymizer,
        refundPrivateKey: view.refundPrivateKey,
        claimPublicKey: view.claimPublicKey,
        token,
        recipient: address,
        noteId,
      })
      const result = await account.strk20InvokeTransaction(actions)
      const hash = result.transaction_hash || result.transactionHash || result
      setTxHash(hash)
      onFlash('ok', 'Private refund-to-note submitted. Waiting for confirmation…')
      const outcome = await waitForSepoliaTxOutcome(hash)
      if (outcome.status === 'failed') {
        onFlash('err', formatWalletError(outcome.error))
        return
      }
      await load()
      if (outcome.status === 'timeout') {
        onFlash(
          'err',
          'Submitted but confirmation timed out. Re-read on-chain state or check the explorer.',
        )
        return
      }
      recordEvidence({
        kind: 'refund',
        mode: 'refund_to_note',
        tx: hash,
        claimPublicKey: view.claimPublicKey,
      })
      onFlash('ok', 'Private refund-to-note confirmed on-chain.')
    } catch (e) {
      onFlash('err', formatWalletError(e))
    } finally {
      setBusy(null)
    }
  }

  const canClaim =
    view &&
    view.kind !== 'refund' &&
    view.state?.status === 'funded' &&
    view.state?.claimable
  const canRefund = Boolean(view && view.kind === 'refund' && view.state?.refundable)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Open a Sepolia claim or refund</h2>
        <p>
          Default: read on-chain → <code>claim_to_address</code> for publicly funded envelopes. Claim-to-note /
          refund-to-note only with a STRK20 Wallet API.
        </p>
      </div>
      <label className="wide">
        <span>Claim / refund link or #fragment</span>
        <textarea rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="#claim/… or #refund/…" />
      </label>
      <button type="button" className="btn primary" disabled={Boolean(busy)} onClick={load}>
        {busy === 'read' ? 'Reading chain…' : 'Read on-chain state'}
      </button>
      {view ? (
        <div className="result stack">
          <dl className="facts">
            <div>
              <dt>Link kind</dt>
              <dd>
                <strong className="pill open">{view.kind}</strong>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <strong className={`pill ${view.state.status}`}>{view.state.status}</strong>
              </dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>
                {formatStrkAmount(view.state.amount)} STRK{' '}
                <span className="muted">({view.state.amount.toString()} raw)</span>
              </dd>
            </div>
            <div>
              <dt>Claimable</dt>
              <dd>{view.state.claimable ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt>Refundable</dt>
              <dd>{view.state.refundable ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt>Pubkey</dt>
              <dd>
                <code>{view.claimPublicKey}</code>
              </dd>
            </div>
          </dl>

          {view.kind !== 'refund' && !canClaim ? (
            <div className="callout warn">
              {view.state?.status === 'claimed' ? (
                <>
                  <strong>Already claimed.</strong> This envelope was claimed. A second claim is rejected by
                  the anonymizer.
                </>
              ) : view.state?.status === 'refunded' ? (
                <>
                  <strong>Refunded.</strong> The funder reclaimed this after expiry. Nothing left to claim.
                </>
              ) : view.state?.refundable || view.state?.status === 'expired' ? (
                <>
                  <strong>Expired.</strong> The claim window closed. Recovery is via the refund link (expiry
                  refund-to-note is Wallet-API gated in the SDK).
                </>
              ) : view.state?.status === 'empty' || view.state?.status === 'none' ? (
                <>
                  <strong>Not funded yet.</strong> This link has no on-chain value. Fund it first, then claim.
                </>
              ) : (
                <>
                  <strong>Not claimable right now.</strong> Status is <code>{view.state?.status}</code>. If you
                  just funded, wait for confirmation and read again.
                </>
              )}
            </div>
          ) : null}

          {view.kind !== 'refund' ? (
            <>
              <label className="wide">
                <span>Recipient address (blank = connected wallet)</span>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x…"
                />
              </label>
              <div className="row-actions fund-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={Boolean(busy) || !canClaim}
                  onClick={claimToAddress}
                >
                  {busy === 'claim-addr' ? 'Claiming…' : 'Claim to address'}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={Boolean(busy) || !canClaim}
                  title="Requires strk20PrepareInvoke + strk20InvokeTransaction"
                  onClick={claimToNote}
                >
                  {busy === 'claim-note' ? 'Claiming…' : 'Claim to note (needs STRK20 API)'}
                </button>
              </div>
              <p className="muted">
                <code>claim_to_address</code> is the default for publicly funded envelopes (no viewing key).
                Pool-funded envelopes need claim-to-note (STRK20 API).
              </p>
              {view.state?.refundable ? (
                <div className="callout warn">
                  <strong>Past expiry.</strong> Claim window is closed. Recovery uses the refund link + a
                  STRK20 privacy wallet (SDK has no public refund call). Keep the refund fragment offline.
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="callout warn">
                <strong>Refund honesty.</strong> Expiry reclaim is <code>refund-to-note</code> via the STRK20
                Wallet API. There is no public-wallet refund path in the Envelope SDK today. If you funded
                publicly, still keep this link — reclaim when a privacy wallet is available, or use the{' '}
                <a href={network.referenceApp} target="_blank" rel="noreferrer">
                  Envelope reference app
                </a>{' '}
                as a second opinion.
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={Boolean(busy) || !canRefund}
                title={!canRefund ? 'Enabled only when on-chain status is refundable (past expiry)' : undefined}
                onClick={refundPrivate}
              >
                {busy === 'refund' ? 'Refunding…' : 'Refund to note (needs STRK20 API)'}
              </button>
              {!canRefund ? (
                <p className="muted">Refund stays disabled until the envelope is past expiry (refundable).</p>
              ) : null}
            </>
          )}

          {txHash ? (
            <p>
              Tx:{' '}
              <a href={explorerTx('sepolia', txHash)} target="_blank" rel="noreferrer">
                {txHash}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function SepoliaNotes({ onFlash }) {
  const [rows, setRows] = useState([])
  const [cashAck, setCashAck] = useState(false)
  useEffect(() => {
    setRows(loadSepoliaKeys())
  }, [])

  const refresh = () => setRows(loadSepoliaKeys())

  const clear = () => {
    if (!window.confirm('Clear local Sepolia key backup from this browser?')) return
    localStorage.removeItem(KEYS_STORAGE)
    refresh()
    onFlash('ok', 'Local key backup cleared.')
  }

  const copyClaim = async (link) => {
    if (!cashAck) {
      onFlash('err', 'Confirm the bearer warning before copying a claim link.')
      return
    }
    await navigator.clipboard.writeText(link)
    onFlash('ok', 'Claim link copied. Anyone with it can attempt a claim.')
  }

  return (
    <section className="panel">
      <div className="panel-head row">
        <div>
          <h2>Keys &amp; refund backup</h2>
          <p>
            Links only (no raw private keys). Refund link is recovery. Claim link is cash.
          </p>
        </div>
        <div className="row-actions">
          <button type="button" onClick={refresh}>
            Refresh
          </button>
          <button type="button" className="danger" onClick={clear}>
            Clear
          </button>
        </div>
      </div>
      <label className="backup-confirm">
        <input type="checkbox" checked={cashAck} onChange={(e) => setCashAck(e.target.checked)} />
        <span>I understand claim links are bearer instruments</span>
      </label>
      {rows.length === 0 ? (
        <p className="empty">No keys yet. Create a Sepolia seal first.</p>
      ) : (
        <ul className="ledger-list">
          {rows.map((r) => (
            <li key={r.claimPublicKey}>
              <div className="ledger-top">
                <strong>
                  {r.amount} STRK
                </strong>
                <span className={`pill ${r.funded ? 'funded' : 'open'}`}>
                  {r.funded ? r.fundMode || 'funded' : 'unfunded'}
                </span>
              </div>
              <div className="ledger-meta">
                <code>{r.claimPublicKey.slice(0, 18)}…</code>
                <span>{formatWhen(r.createdAt)}</span>
              </div>
              <div className="row-actions">
                {r.claimLink ? (
                  <button type="button" onClick={() => copyClaim(r.claimLink)}>
                    Copy claim
                  </button>
                ) : null}
                {r.refundLink ? (
                  <button type="button" onClick={() => navigator.clipboard.writeText(r.refundLink)}>
                    Copy refund
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DemoCreate({ onCreated, onError }) {
  const [token, setToken] = useState('STRK')
  const [amount, setAmount] = useState('10')
  const [expiryMs, setExpiryMs] = useState(EXPIRY_OPTIONS[1].ms)
  const [memo, setMemo] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const create = async () => {
    setBusy(true)
    setResult(null)
    try {
      const amt = Number(amount)
      if (!(amt > 0)) throw new Error('Amount must be greater than zero')
      const keys = await generateClaimKey()
      const commitment = await commitmentHash(keys.publicKeyHex)
      const id = randomId()
      const createdAt = Date.now()
      const expiresAt = createdAt + expiryMs
      const entry = {
        id,
        token,
        amount: amt,
        memo: memo.trim(),
        commitment,
        publicKeyHex: keys.publicKeyHex,
        status: 'open',
        createdAt,
        expiresAt,
        mode: 'demo',
      }
      createEnvelope(entry)
      const link = encodeDemoLink(appBaseUrl(), {
        v: 1,
        id,
        commitment,
        publicKeyHex: keys.publicKeyHex,
        privateKeyHex: keys.privateKeyHex,
        token,
        amount: amt,
        memo: entry.memo,
        expiresAt,
      })
      setResult({ link, entry })
      onCreated()
    } catch (e) {
      onError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Seal a demo claim</h2>
        <p>Local ledger only. Destination-bound signatures, not the front-runnable secret-preimage helper.</p>
      </div>
      <div className="form-grid">
        <label>
          <span>Token</span>
          <select value={token} onChange={(e) => setToken(e.target.value)}>
            <option>STRK</option>
            <option>USDC</option>
            <option>ETH</option>
          </select>
        </label>
        <label>
          <span>Amount</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label>
          <span>Expires</span>
          <select value={expiryMs} onChange={(e) => setExpiryMs(Number(e.target.value))}>
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.ms} value={o.ms}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          <span>Memo</span>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="bounty-142" />
        </label>
      </div>
      <button type="button" className="btn primary" disabled={busy} onClick={create}>
        {busy ? 'Sealing…' : 'Create claim link'}
      </button>
      {result ? (
        <div className="result">
          <label className="wide">
            <span>Claim link</span>
            <textarea readOnly rows={3} value={result.link} />
          </label>
          <button type="button" onClick={() => navigator.clipboard.writeText(result.link)}>
            Copy link
          </button>
        </div>
      ) : null}
    </section>
  )
}

function DemoClaim({ onDone, onError }) {
  const initial = decodeClaimLinkFragment(window.location.hash)
  const [paste, setPaste] = useState('')
  const payload = useMemo(() => {
    if (initial) return initial
    if (!paste.trim()) return null
    try {
      return decodeClaimLinkFragment(new URL(paste.trim()).hash)
    } catch {
      return decodeClaimLinkFragment(paste.trim().startsWith('#') ? paste.trim() : `#/claim/${paste.trim()}`)
    }
  }, [initial, paste])
  const [destination, setDestination] = useState('demo-note-recipient')
  const [busy, setBusy] = useState(false)
  const [local, setLocal] = useState(null)

  useEffect(() => {
    if (!payload?.id) return setLocal(null)
    setLocal(getEnvelope(payload.id) || getByCommitment(payload.commitment))
  }, [payload])

  const status = envelopeStatus(local)

  const claim = async () => {
    setBusy(true)
    try {
      if (!payload?.privateKeyHex) throw new Error('No claim key in link')
      if (!local) throw new Error('Envelope not in this browser’s demo ledger')
      if (status !== 'open') throw new Error(`Cannot claim: ${status}`)
      const { privateKey } = await importClaimKey(payload.privateKeyHex)
      const pub = await importPublicKey(payload.publicKeyHex)
      const signature = await signClaim(privateKey, {
        commitment: payload.commitment,
        destination,
        amount: payload.amount,
      })
      const ok = await verifyClaim(
        pub,
        { commitment: payload.commitment, destination, amount: payload.amount },
        signature,
      )
      if (!ok) throw new Error('Signature failed')
      const retarget = await verifyClaim(
        pub,
        { commitment: payload.commitment, destination: 'attacker', amount: payload.amount },
        signature,
      )
      if (retarget) throw new Error('Retarget check failed')
      markClaimed(local.id, { destination, claimedAt: Date.now() })
      setLocal(getEnvelope(local.id))
      onDone()
    } catch (e) {
      onError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Open a demo claim</h2>
        <p>Verifies destination-bound auth, then updates the local ledger.</p>
      </div>
      {!initial ? (
        <label className="wide">
          <span>Paste claim link</span>
          <textarea rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} />
        </label>
      ) : (
        <p className="banner">Link loaded from URL fragment.</p>
      )}
      {payload ? (
        <div className="claim-card">
          <div className="amount-line">
            <span className="token">{payload.token}</span>
            <strong>{formatAmount(payload.amount)}</strong>
          </div>
          <p>
            Status: <strong className={`pill ${status}`}>{status}</strong>
          </p>
          <label>
            <span>Destination</span>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} />
          </label>
          <button type="button" className="btn primary" disabled={busy || status !== 'open'} onClick={claim}>
            {busy ? 'Claiming…' : 'Claim'}
          </button>
        </div>
      ) : (
        <p className="empty">No claim payload yet.</p>
      )}
    </section>
  )
}

function DemoLedger({ rows, onRefresh, onClear, onRefund }) {
  const counts = { open: 0, claimed: 0, expired: 0, refunded: 0 }
  rows.forEach((e) => {
    const st = envelopeStatus(e)
    if (counts[st] != null) counts[st] += 1
  })

  return (
    <section className="panel">
      <div className="panel-head row">
        <div>
          <h2>Demo ledger</h2>
          <p>Local stand-in for anonymizer state.</p>
        </div>
        <div className="row-actions">
          <button type="button" onClick={onRefresh}>
            Refresh
          </button>
          <button type="button" className="danger" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>
      <DonutChart counts={counts} />
      {rows.length === 0 ? (
        <p className="empty">No envelopes yet. Create one on the Create tab to fill the composition chart.</p>
      ) : (
        <ul className="ledger-list">
          {rows.map((e) => {
            const st = envelopeStatus(e)
            return (
              <li key={e.id}>
                <div className="ledger-top">
                  <strong>
                    {formatAmount(e.amount)} {e.token}
                  </strong>
                  <span className={`pill ${st}`}>{st}</span>
                </div>
                {st === 'expired' ? (
                  <button type="button" onClick={() => onRefund(e.id)}>
                    Refund
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
