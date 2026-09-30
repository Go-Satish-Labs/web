import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import type { Forecast, ForecastPoint } from '../lib/api'

/** Human label for a parsed intent, so the answer says what was understood. */
const INTENT_LABELS: Record<string, string> = {
  forecast: 'Looking ahead',
  trend: 'Trend over time',
  aggregate: 'Single number',
  compare: 'Comparison',
  top_bottom: 'Ranking',
  correlate: 'Relationship',
  anomaly: 'Data quality',
  describe: 'What is in this file',
  count: 'Dataset size',
  unknown: 'Not recognised',
}

function humanField(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const a = Math.abs(v)
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (a >= 10_000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (a >= 100) return v.toLocaleString(undefined, { maximumFractionDigits: 1 })
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const DIRECTION: Record<string, { text: string; color: string; bg: string; icon: string }> = {
  increasing: { text: 'Trending up', color: '#15803d', bg: '#f0fdf4', icon: '↑' },
  decreasing: { text: 'Trending down', color: '#b91c1c', bg: '#fef2f2', icon: '↓' },
  flat: { text: 'Staying flat', color: '#92400e', bg: '#fffbeb', icon: '→' },
}

const CONFIDENCE: Record<string, { text: string; color: string }> = {
  high: { text: 'High confidence', color: '#15803d' },
  moderate: { text: 'Moderate confidence', color: '#ca8a04' },
  low: { text: 'Low confidence', color: '#b45309' },
}

/**
 * Renders a forecast returned by /ai/ask.
 *
 * When the dataset has a date column this draws the observed history and the
 * projected future as one continuous line, split at "today" so the projected
 * part is visibly different from measured data. When it does not, the model
 * ran a holdout backtest instead, and this shows the measured accuracy rather
 * than drawing a fictional timeline.
 */
export default function ForecastChart({ forecast }: { forecast: Forecast }) {
  if (forecast.kind === 'holdout_backtest') {
    return (
      <div style={{
        marginTop: 10, borderRadius: 12, padding: '14px 16px',
        background: '#f9fafb', border: '1.5px solid #e8e8e8',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>
          No date column — accuracy check instead
        </div>
        <div style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.6 }}>
          {forecast.note}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
          <Stat label="Explains" value={`${forecast.r2_pct ?? 0}%`} sub="of the variation" />
          <Stat
            label="Confidence"
            value={CONFIDENCE[forecast.confidence ?? 'low']?.text ?? '—'}
            sub={`${forecast.rows_held_out ?? 0} unseen rows`}
            color={CONFIDENCE[forecast.confidence ?? 'low']?.color}
          />
          <Stat label="Typical error" value={fmt(forecast.mean_absolute_error)} sub="per row" />
        </div>
      </div>
    )
  }

  const history = forecast.history ?? []
  const future = forecast.forecast ?? []
  const direction = DIRECTION[forecast.direction ?? 'flat'] ?? DIRECTION.flat
  const confidence = CONFIDENCE[forecast.confidence ?? 'low'] ?? CONFIDENCE.low

  // One shared axis, but two series: the measured part is solid, the
  // projected part dashed. Each carries its own name so the tooltip can say
  // which side of "now" a point is on without a custom formatter.
  const combined: (ForecastPoint & { projected: boolean })[] = [
    ...history.map(p => ({ ...p, projected: false })),
    ...future.map(p => ({ ...p, projected: true })),
  ]
  const seam = history.length - 1
  const actual = combined.map(p => ({ ...p, y: p.projected ? null : p.y }))
  // The projected line starts at the final measured point so the two connect.
  const projected = combined.map((p, i) => ({ ...p, y: p.projected || i === seam ? p.y : null }))

  const boundary = history.length ? history[history.length - 1].x : undefined

  return (
    <div style={{
      marginTop: 10, borderRadius: 12, padding: '14px 16px',
      background: '#fff', border: '1.5px solid #e8e8e8',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: direction.color, background: direction.bg,
          padding: '3px 9px', borderRadius: 999,
        }}>
          {direction.icon} {direction.text}
        </span>
        <span style={{ fontSize: 12, color: confidence.color, fontWeight: 600 }}>
          {confidence.text}
        </span>
        <span style={{ fontSize: 11, color: '#a8a8a8' }}>·</span>
        <span style={{ fontSize: 12, color: '#6b6b6b' }}>{forecast.method}</span>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={combined} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ececec" vertical={false} />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 10, fill: '#a8a8a8' }}
            tickLine={false} axisLine={false}
            minTickGap={28}
          />
          <YAxis tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} width={52}
            tickFormatter={(v: number) => fmt(v)} />
          <Tooltip
            contentStyle={{ borderRadius: 10, borderColor: '#e8e8e8', background: '#fff', fontSize: 12 }}
            labelStyle={{ fontWeight: 600, color: '#6b6b6b' }}
            formatter={(value, name) => {
              const raw = Array.isArray(value) ? value[0] : value
              return [fmt(Number(raw)), String(name)]
            }}
          />
          {boundary && (
            <ReferenceLine x={boundary} stroke="#d0d0d0" strokeDasharray="4 4"
              label={{ value: 'now', position: 'insideTopRight', fontSize: 10, fill: '#a8a8a8' }} />
          )}
          <Line type="monotone" dataKey="y" name="Recorded" stroke="#0a0a0a" strokeWidth={2}
            dot={false} connectNulls data={actual} />
          <Line type="monotone" dataKey="y" name="Projected" stroke="#6b6b6b" strokeWidth={2}
            strokeDasharray="5 4" dot={false} connectNulls data={projected} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
        <Stat
          label={`Last ${humanField(forecast.metric)}`}
          value={fmt(forecast.last_actual)}
          sub={forecast.last_actual_date}
        />
        <Stat
          label="Projected"
          value={fmt(forecast.predicted_value)}
          sub={forecast.predicted_date}
        />
        {forecast.change_pct !== null && forecast.change_pct !== undefined && (
          <Stat
            label="Change"
            value={`${forecast.change_pct >= 0 ? '+' : ''}${forecast.change_pct}%`}
            sub="vs last recorded"
            color={forecast.change_pct >= 0 ? '#15803d' : '#b91c1c'}
          />
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8' }}>
        {label}
      </div>
      <div className="font-mono-num" style={{ fontSize: 16, fontWeight: 800, color: color ?? '#0a0a0a', marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#a8a8a8' }}>{sub}</div>}
    </div>
  )
}

export { INTENT_LABELS }
