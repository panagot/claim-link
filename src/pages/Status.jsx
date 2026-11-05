import { useEffect, useMemo } from 'react'
import ReachabilityChart from '../components/charts/ReachabilityChart'
import TimeSeriesChart from '../components/charts/TimeSeriesChart'
import Tooltip from '../components/Tooltip'
import { useNetwork } from '../components/NetworkContext'
import { NETWORKS } from '../config/networks'
import { explorerContract } from '../lib/sepolia'

export default function Status() {
  const { setNetworkId, health, probing, refreshHealth, probeHistory } = useNetwork()

  useEffect(() => {
    setNetworkId('sepolia')
  }, [setNetworkId])

  const word = probing ? 'Checking' : health?.ok ? 'Reachable' : 'Issue'

  const summary = useMemo(() => {
    const pts = probeHistory || []
    const total = pts.length
    const okPts = pts.filter((p) => p.ok)
    const lat = okPts.map((p) => p.ms).filter((m) => typeof m === 'number')
    const avg = lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null
    const max = lat.length ? Math.max(...lat) : null
    const uptime = total ? Math.round((okPts.length / total) * 100) : null
    return { total, uptime, avg, max }
  }, [probeHistory])

  const sep = NETWORKS.sepolia

  return (
    <main className="page status">
      <header className="page-head status-head">
        <div>
          <p className="eyebrow">Network observatory</p>
          <h1>Sepolia status</h1>
          <p className="page-lede">
            Live probes against the public STRK20 privacy pool and the deployed Envelope anonymizer.
            Reachable contracts are not the same as funding from this UI.
          </p>
        </div>
        <button type="button" className={`btn ${probing ? 'busy' : ''}`} disabled={probing} onClick={refreshHealth}>
          {probing ? 'Probing…' : 'Refresh probes'}
        </button>
      </header>

      <section className="status-theater">
        <div className={`status-word ${health?.ok ? 'ok' : probing ? 'wait' : 'bad'}`}>
          <span className="pulse-dot" aria-hidden="true" />
          {word}
        </div>
        <dl className="status-metrics">
          <div>
            <dt>
              <Tooltip title="Block" body="Latest Sepolia block number from the public RPC used for probes.">
                Block
              </Tooltip>
            </dt>
            <dd>{health?.blockNumber ?? '—'}</dd>
          </div>
          <div>
            <dt>
              <Tooltip title="Probe latency" body="Wall time for blockNumber plus both class-hash probes.">
                Probe
              </Tooltip>
            </dt>
            <dd>{health?.ms != null ? `${health.ms} ms` : '—'}</dd>
          </div>
          <div>
            <dt>
              <Tooltip title="Checked" body="Local clock when the last probe finished.">
                Checked
              </Tooltip>
            </dt>
            <dd>{health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="session-summary">
        <div className="sum-card">
          <span className="sum-k">Session samples</span>
          <span className="sum-v">{summary.total || '—'}</span>
        </div>
        <div className="sum-card">
          <span className="sum-k">Reachable</span>
          <span className="sum-v">{summary.uptime != null ? `${summary.uptime}%` : '—'}</span>
        </div>
        <div className="sum-card">
          <span className="sum-k">Avg latency</span>
          <span className="sum-v">{summary.avg != null ? `${summary.avg} ms` : '—'}</span>
        </div>
        <div className="sum-card">
          <span className="sum-k">Peak latency</span>
          <span className="sum-v">{summary.max != null ? `${summary.max} ms` : '—'}</span>
        </div>
      </section>

      <div className="chart-stack">
        <TimeSeriesChart points={probeHistory} />
        <ReachabilityChart points={probeHistory} />
      </div>

      <section className="panel endpoints-panel">
        <h2>Monitored endpoints</h2>
        <p className="muted">Exactly what these probes hit, so anyone can reproduce them.</p>
        <dl className="endpoint-list">
          <div>
            <dt>RPC</dt>
            <dd><code>{sep.rpcUrl}</code></dd>
          </div>
          <div>
            <dt>Chain ID</dt>
            <dd><code>{sep.chainId}</code> (SN_SEPOLIA)</dd>
          </div>
          <div>
            <dt>Explorer</dt>
            <dd>
              <a href={sep.explorer} target="_blank" rel="noreferrer">
                {sep.explorer.replace('https://', '')}
              </a>
            </dd>
          </div>
          <div>
            <dt>Probe method</dt>
            <dd><code>getClassHashAt</code> on pool + anonymizer, plus latest <code>blockNumber</code></dd>
          </div>
        </dl>
      </section>

      <div className="status-grid">
        <StatusCard
          title="STRK20 Privacy Pool"
          tip="Canonical Sepolia pool for SDK and integration testing. Up means getClassHashAt succeeded."
          item={health?.pool}
        />
        <StatusCard
          title="Envelope Anonymizer"
          tip="Claim-link anonymizer previously funded through the Sepolia pool. Up means class hash probe succeeded."
          item={health?.anonymizer}
        />
      </div>

      <section className="legend panel">
        <h2>Legend</h2>
        <ul>
          <li>
            <strong>Reachable</strong> means class hash probes succeed on public RPC.
          </li>
          <li>
            <strong>Public fund / claim_to_address</strong> work from this UI with any Sepolia wallet (funder
            identity visible).
          </li>
          <li>
            <strong>Private pool Fund / claim-to-note / refund-to-note</strong> need a STRK20 Wallet API (or
            the{' '}
            <a href="https://0xrlawrence.github.io/envelope/" target="_blank" rel="noreferrer">
              Envelope reference app
            </a>
            ).
          </li>
          <li>
            Charts use <Tooltip title="Session history" body="Last 20 probes stored in sessionStorage on this browser only.">session probe history</Tooltip>
            . Refresh appends a point.
          </li>
        </ul>
      </section>
    </main>
  )
}

function StatusCard({ title, tip, item }) {
  return (
    <article className={`status-card ${item?.ok ? 'ok' : item ? 'bad' : ''}`}>
      <header>
        <h3>
          <Tooltip title={title} body={tip}>
            {title}
          </Tooltip>
        </h3>
        <span className={`pill ${item?.ok ? 'open' : 'expired'}`}>{item ? (item.ok ? 'up' : 'down') : '…'}</span>
      </header>
      {item ? (
        <>
          <a href={explorerContract('sepolia', item.address)} target="_blank" rel="noreferrer" className="addr">
            {item.address}
          </a>
          <p className="muted">
            {item.ok ? (
              <>
                class {item.classHash?.slice(0, 14)}… · {item.ms}ms
              </>
            ) : (
              item.error
            )}
          </p>
        </>
      ) : (
        <p className="muted">No probe yet.</p>
      )}
    </article>
  )
}
