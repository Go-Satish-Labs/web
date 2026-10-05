import { Link } from 'react-router-dom'
import type { UsageInfo } from '../lib/api'

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0
  const isCrit = pct >= 90
  const isWarn = pct >= 70
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: '#6b6b6b', marginBottom: 7 }}>
        <span>{label}</span>
        <span className="font-mono-num" style={{ color: isCrit ? '#dc2626' : isWarn ? '#ca8a04' : '#0a0a0a' }}>{used}/{max}</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: '#e8e8e8' }}>
        <div style={{
          height: 4, borderRadius: 4,
          width: `${pct}%`,
          background: isCrit ? '#dc2626' : isWarn ? '#ca8a04' : '#0a0a0a',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

/**
 * Quota counters for the workspace.
 *
 * Usage is passed in rather than fetched here. This component used to fetch
 * it once on mount, so it kept showing the count it had at page load: upload a
 * file and the counter stayed behind, delete one and it stayed too. Whoever
 * owns the data now refreshes both together.
 */
export default function QuotaBar({ usage }: { usage: UsageInfo | null }) {
  if (!usage) return null

  // Deleting a file does not return its slot, so the meter can sit above the
  // number of files actually on disk. Say so, or it reads as a stuck counter.
  const stored = usage.usage.current_datasets
  const deleted = typeof stored === 'number' && stored < usage.usage.datasets
    ? usage.usage.datasets - stored
    : 0
  const datasetLabel = deleted > 0
    ? `Datasets (${deleted} deleted)`
    : 'Datasets'

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24,
      padding: '16px 20px', borderRadius: 12, marginBottom: 24,
      background: '#ffffff', border: '1.5px solid #e8e8e8',
    }}>
      <UsageBar used={usage.usage.datasets} max={usage.limits.max_datasets} label={datasetLabel} />
      <UsageBar used={Math.round(usage.usage.storage_mb)} max={usage.limits.max_storage_mb} label="Storage (MB)" />
      <UsageBar used={usage.usage.dashboards} max={usage.limits.max_dashboards} label="Dashboards" />
      {usage.plan === 'free' && (
        <Link to="/billing" style={{
          marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '7px 16px',
          borderRadius: 8, background: '#0a0a0a', color: '#fff',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Upgrade →
        </Link>
      )}
    </div>
  )
}
