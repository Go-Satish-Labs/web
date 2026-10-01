import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import Shell from '../components/Shell'
import PredictionSetup from '../components/PredictionSetup'
import ShareButton from '../components/ShareButton'
import { api, apiErrorMessage, type ChartSpec, type DashboardConfig, type DataStructure, type Prediction } from '../lib/api'

/* ── helpers ── */
function fn(raw: string): string {
  return raw.replace(/_growth_pct$/i, ' Growth').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}
function anomalyMsg(type: string, col: string | null, count?: number, value?: number): string {
  switch (type) {
    case 'outliers':       return `${count} unusual value${count !== 1 ? 's' : ''} in "${fn(col ?? '')}" — far outside the normal range, may be errors.`
    case 'invalid_dates':  return `${count} unreadable date${count !== 1 ? 's' : ''} in "${fn(col ?? '')}" — check for typos or mixed formats.`
    case 'high_missing_pct': return `"${fn(col ?? '')}" is ${value}% empty — over 1 in 5 rows missing.`
    case 'duplicate_rows': return `${count} duplicate row${count !== 1 ? 's' : ''} — same record appears more than once, may inflate totals.`
    default: return `${fn(type)}${col ? ` in "${fn(col)}"` : ''}`
  }
}
function corrLabel(r: number): { text: string; color: string } {
  const a = Math.abs(r), dir = r >= 0 ? 'move together' : 'move oppositely'
  if (a >= 0.8) return { text: `Very strong — they ${dir}`, color: '#16a34a' }
  if (a >= 0.6) return { text: `Strong — they tend to ${dir}`, color: '#16a34a' }
  if (a >= 0.4) return { text: `Moderate — somewhat ${dir}`, color: '#ca8a04' }
  if (a >= 0.2) return { text: `Weak — slight tendency to ${dir}`, color: '#6b6b6b' }
  return { text: 'No meaningful relationship', color: '#a8a8a8' }
}

const card: React.CSSProperties = { borderRadius: 14, padding: '20px', background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }
const tt = { contentStyle: { borderRadius: 10, borderColor: '#e8e8e8', background: '#fff', fontSize: 12 }, labelStyle: { fontWeight: 600, color: '#6b6b6b' } }
const GRAYS = ['#0a0a0a', '#3a3a3a', '#6b6b6b', '#a8a8a8', '#d0d0d0', '#e8e8e8', '#f3f3f3']

/* ── Data structure banner ── */
function StructureBanner({ ds }: { ds: DataStructure }) {
  const bg   = ds.is_labeled ? '#f0fdf4' : '#fffbeb'
  const border = ds.is_labeled ? 'rgba(22,163,74,0.2)' : 'rgba(202,138,4,0.25)'
  const color  = ds.is_labeled ? '#15803d' : '#92400e'
  const icon   = ds.is_labeled ? '🏷️' : '🔍'
  return (
    <div style={{ padding: '14px 18px', borderRadius: 12, background: bg, border: `1.5px solid ${border}`, marginBottom: 24, fontSize: 13, color, lineHeight: 1.6 }}>
      <span style={{ fontWeight: 700 }}>{icon} {ds.is_labeled ? 'Labeled dataset detected' : 'Unlabeled dataset detected'} — </span>
      {ds.summary}
      {!ds.has_headers && <span style={{ display: 'block', marginTop: 4, opacity: 0.8 }}>Columns were auto-named since no headers were found.</span>}
    </div>
  )
}

/* ── KPI cards ── */
function KpiCards({ config }: { config: DashboardConfig }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', marginBottom: 32 }} className="kpi-grid">
      {config.kpi_cards.map(k => {
        const isGrowth = k.growth_pct !== undefined && k.growth_pct !== null
        return (
          <div key={k.metric} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#0a0a0a' }} />
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b', marginBottom: 10 }}>{fn(k.metric)}</div>
            {isGrowth ? (
              <>
                <div className="font-mono-num" style={{ fontSize: 26, fontWeight: 800, color: (k.growth_pct ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                  {(k.growth_pct ?? 0) >= 0 ? '+' : ''}{k.growth_pct}%
                </div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 6 }}>{(k.growth_pct ?? 0) >= 0 ? '↑ Increased' : '↓ Decreased'} over period</div>
              </>
            ) : (
              <>
                <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#0a0a0a' }}>{k.sum?.toLocaleString() ?? '—'}</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>avg {k.average?.toLocaleString() ?? '—'}</span>
                  <span>· {k.count?.toLocaleString()} rows</span>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Plain-language reading under every chart ──
   A reader who cannot interpret the shape still needs to learn what the chart
   is for and what it says. Both sentences come from the server, computed off
   the chart's own numbers, so they cannot drift from the picture. */
function ChartReading({ chart }: { chart: ChartSpec }) {
  const reading = chart.reading
  if (!reading?.purpose && !reading?.takeaway) return null
  return (
    <div style={{
      marginTop: 12, padding: '10px 12px', borderRadius: 10,
      background: '#f8f9fa', border: '1px solid #eef0f2',
    }}>
      {reading.purpose && (
        <div style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.55, marginBottom: reading.takeaway ? 6 : 0 }}>
          <span style={{ fontWeight: 700, color: '#0a0a0a' }}>What this shows: </span>
          {reading.purpose}
        </div>
      )}
      {reading.takeaway && (
        <div style={{ fontSize: 12, color: '#0a0a0a', lineHeight: 1.55 }}>
          <span style={{ fontWeight: 700 }}>What it says: </span>
          {reading.takeaway}
        </div>
      )}
    </div>
  )
}

/* ── Charts ── */
function Chart({ chart }: { chart: ChartSpec }) {
  if (chart.type === 'line' && chart.data) return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Trend</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', margin: '4px 0 4px' }}>{fn(chart.title)}</div>
      <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 14 }}>How this value changed over time</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tt} />
          <Line type="monotone" dataKey="y" stroke="#0a0a0a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <ChartReading chart={chart} />
    </div>
  )

  if (chart.type === 'bar' && chart.data) return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Comparison</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', margin: '4px 0 4px' }}>{fn(chart.title)}</div>
      <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 14 }}>Top categories ranked by value</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false}
            angle={chart.data.length > 6 ? -30 : 0} textAnchor={chart.data.length > 6 ? 'end' : 'middle'}
            height={chart.data.length > 6 ? 55 : 28} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tt} />
          <Bar dataKey="y" name="Value" radius={[4, 4, 0, 0]}>
            {chart.data.map((_, i) => <Cell key={i} fill={i === 0 ? '#0a0a0a' : i < 3 ? '#3a3a3a' : '#a8a8a8'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartReading chart={chart} />
    </div>
  )

  if (chart.type === 'histogram' && chart.data) return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Distribution</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', margin: '4px 0 4px' }}>{fn(chart.title)}</div>
      <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 14 }}>How values are spread across ranges</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#a8a8a8' }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={50} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} width={36} />
          <Tooltip {...tt} />
          <Bar dataKey="y" name="Count" fill="#6b6b6b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <ChartReading chart={chart} />
    </div>
  )

  if (chart.type === 'scatter' && chart.data) return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Relationship</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', margin: '4px 0 4px' }}>{fn(chart.title)}</div>
      <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 14 }}>Each dot is one row — look for patterns</div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis dataKey="x" name={fn(chart.x_label ?? 'X')} tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} />
          <YAxis dataKey="y" name={fn(chart.y_label ?? 'Y')} tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} width={48} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} {...tt} />
          <Scatter data={chart.data} fill="#0a0a0a" opacity={0.55} />
        </ScatterChart>
      </ResponsiveContainer>
      <ChartReading chart={chart} />
    </div>
  )

  if (chart.type === 'pie' && chart.data) return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Breakdown</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', margin: '4px 0 14px' }}>{fn(chart.title)}</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chart.data} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
            {chart.data.map((_, i) => <Cell key={i} fill={GRAYS[i % GRAYS.length]} />)}
          </Pie>
          <Tooltip {...tt} />
        </PieChart>
      </ResponsiveContainer>
      <ChartReading chart={chart} />
    </div>
  )

  if (chart.type === 'stacked_bar' && chart.categories && chart.series) {
    const data = chart.categories.map((cat, i) => {
      const row: Record<string, string | number> = { x: cat }
      chart.series!.forEach(s => { row[s.name] = s.data[i] ?? 0 })
      return row
    })
    return (
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Stacked comparison</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', margin: '4px 0 14px' }}>{fn(chart.title)}</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#a8a8a8' }} tickLine={false} axisLine={false} width={48} />
            <Tooltip {...tt} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {chart.series.map((s, i) => (
              <Bar key={s.name} dataKey={s.name} stackId="a" fill={GRAYS[i % GRAYS.length]} radius={i === chart.series!.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <ChartReading chart={chart} />
      </div>
    )
  }

  if (chart.type === 'top_bottom') return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Rankings</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', margin: '4px 0 4px' }}>{fn(chart.title)}</div>
      <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 14 }}>Best and worst performers</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="ranking-grid">
        <div style={{ borderRadius: 10, padding: 14, background: '#f0fdf4', border: '1.5px solid rgba(22,163,74,0.15)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 10 }}>🏆 Top</div>
          {chart.top?.map((t, i) => (
            <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(22,163,74,0.1)', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(22,163,74,0.15)', color: '#16a34a', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              </div>
              <span className="font-mono-num" style={{ color: '#6b6b6b', flexShrink: 0, marginLeft: 8 }}>{t.value?.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 10, padding: 14, background: '#fef2f2', border: '1.5px solid rgba(220,38,38,0.15)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>⚠️ Bottom</div>
          {[...(chart.bottom ?? [])].reverse().map((t, i) => (
            <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(220,38,38,0.1)', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(220,38,38,0.12)', color: '#dc2626', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              </div>
              <span className="font-mono-num" style={{ color: '#6b6b6b', flexShrink: 0, marginLeft: 8 }}>{t.value?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <ChartReading chart={chart} />
    </div>
  )

  return null
}

/* ── Data quality ── */
function DataQualityPanel({ config }: { config: DashboardConfig }) {
  const dq = config.data_quality
  return (
    <div style={{ ...card, marginBottom: 32 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>Data health check</div>
      <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 16 }}>Issues that could affect dashboard accuracy.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Pill color="#0a0a0a" bg="#f3f3f3">{dq.row_count.toLocaleString()} rows</Pill>
        {dq.duplicate_row_count > 0 ? <Pill color="#92400e" bg="#fffbeb">⚠ {dq.duplicate_row_count} duplicates</Pill> : <Pill color="#16a34a" bg="#f0fdf4">✓ No duplicates</Pill>}
        {dq.columns_with_missing.length > 0 ? <Pill color="#92400e" bg="#fffbeb">⚠ {dq.columns_with_missing.length} cols with gaps</Pill> : <Pill color="#16a34a" bg="#f0fdf4">✓ No missing values</Pill>}
      </div>
      {config.anomalies.length === 0 ? (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600, border: '1.5px solid rgba(22,163,74,0.2)' }}>✓ No issues detected — data looks clean.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {config.anomalies.map((a, i) => (
            <div key={i} style={{ padding: '11px 14px', borderRadius: 10, background: '#f9f9f9', border: '1.5px solid #e8e8e8', fontSize: 13, lineHeight: 1.5 }}>
              {anomalyMsg(a.type, a.column, a.count, a.value)}
            </div>
          ))}
        </div>
      )}
      {config.correlations.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Column relationships</div>
          <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 12 }}>When two columns are correlated, one tends to predict the other.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.correlations.map((c, i) => {
              const { text, color } = corrLabel(c.correlation)
              const pct = Math.round(Math.abs(c.correlation) * 100)
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: '#f9f9f9', border: '1.5px solid #e8e8e8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fn(c.field_a)} ↔ {fn(c.field_b)}</span>
                    <span className="font-mono-num" style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 6 }}>{text}</div>
                  <div style={{ height: 4, background: '#e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Pill({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, color, background: bg }}>{children}</span>
}

/* ── Preview table ── */
type PreviewData = { original_filename: string; columns: string[]; rows: Array<Record<string, unknown>>; row_count: number }
function PreviewTable({ preview }: { preview: PreviewData }) {
  return (
    <div style={{ ...card, marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b6b' }}>Raw data preview</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginTop: 4 }}>{preview.original_filename}</div>
          <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{preview.row_count.toLocaleString()} rows · showing first {preview.rows.length}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: '#f3f3f3', color: '#6b6b6b' }}>Read-only</span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1.5px solid #e8e8e8' }}>
        <table style={{ minWidth: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9f9f9' }}>
            <tr>{preview.columns.map(col => <th key={col} style={{ textAlign: 'left', padding: '9px 13px', fontWeight: 700, color: '#6b6b6b', whiteSpace: 'nowrap', borderBottom: '1.5px solid #e8e8e8' }}>{fn(col)}</th>)}</tr>
          </thead>
          <tbody>
            {preview.rows.map((row, ri) => (
              <tr key={ri} style={{ borderTop: '1px solid #e8e8e8' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {preview.columns.map(col => <td key={col} style={{ padding: '8px 13px', whiteSpace: 'nowrap', color: '#0a0a0a' }}>{String(row[col] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Export button ── */
function ExportBtn({ datasetId }: { datasetId: string }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const opts = [
    { label: 'JSON', fmt: 'json', desc: 'Raw data for developers' },
    { label: 'CSV',  fmt: 'csv',  desc: 'Open in Excel / Sheets' },
    { label: 'HTML', fmt: 'html', desc: 'Printable report' },
  ]

  /**
   * Fetches through the axios client, not a plain <a href>.
   *
   * The backend authenticates via the Authorization header only, and a
   * browser navigation cannot send one - so linking straight to the export URL
   * always returned 401 "Not authenticated". Going through `api` attaches the
   * token, and the response is turned into a blob we save ourselves.
   */
  async function download(fmt: string, label: string) {
    setError('')
    setBusy(fmt)
    try {
      const response = await api.get(
        `/dashboards/by-dataset/${datasetId}/export`,
        { params: { fmt }, responseType: 'blob' },
      )
      const blob = new Blob([response.data], { type: mimeFor(fmt) })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${label.toLowerCase()}-${datasetId.slice(0, 8)}.${extFor(fmt)}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Revoking immediately can cancel the download in some browsers.
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
      setOpen(false)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  function toggle() {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  return (
    <>
      <button ref={btnRef} onClick={e => { e.stopPropagation(); toggle() }}
        style={{ fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        Export
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && rect && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', top: rect.bottom + 6, right: window.innerWidth - rect.right, background: '#fff', borderRadius: 12, border: '1.5px solid #e8e8e8', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 9999, minWidth: 210 }}>
          {opts.map(o => (
            <button key={o.fmt} onClick={() => download(o.fmt, o.label)} disabled={busy !== null}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px',
                border: 'none', background: 'transparent', cursor: busy ? 'wait' : 'pointer',
                borderBottom: '1px solid #f3f3f3', opacity: busy && busy !== o.fmt ? 0.5 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9f9f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>
                {busy === o.fmt ? 'Preparing…' : o.label}
              </div>
              <div style={{ fontSize: 11, color: '#6b6b6b' }}>{o.desc}</div>
            </button>
          ))}
          {error && (
            <div style={{ padding: '9px 16px', fontSize: 11, color: '#dc2626', background: '#fef2f2' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </>
  )
}

const extFor = (fmt: string) => (fmt === 'json' ? 'json' : fmt === 'csv' ? 'csv' : 'html')
const mimeFor = (fmt: string) =>
  fmt === 'json' ? 'application/json'
  : fmt === 'csv' ? 'text/csv'
  : 'text/html'

/* ── History / Prediction toggle ── */
type ViewMode = 'history' | 'prediction'

/**
 * Two views of the same file, with History as the default.
 *
 * History answers "what is in my data" and is always available. Prediction
 * asks the user what to predict, because the engine's automatic choice of
 * target is wrong often enough to be actively misleading.
 */
function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const options: { id: ViewMode; label: string; hint: string }[] = [
    { id: 'history', label: 'What happened', hint: 'KPIs, charts and data health' },
    { id: 'prediction', label: "What's likely next", hint: 'Choose what to predict' },
  ]
  return (
    <div style={{ display: 'inline-flex', gap: 3, padding: 3, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
      {options.map(o => {
        const active = mode === o.id
        return (
          <button key={o.id} onClick={() => onChange(o.id)} title={o.hint}
            style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: active ? '#fff' : 'transparent',
              color: active ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
              transition: 'all 0.18s ease',
            }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Page ── */
export default function DatasetDetailPage() {
  const { id } = useParams()
  const [title, setTitle]     = useState('')
  const [config, setConfig]   = useState<DashboardConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [mode, setMode] = useState<ViewMode>('history')
  // Lifted from PredictionSetup so the share button can publish exactly the
  // prediction the user is looking at.
  const [prediction, setPrediction] = useState<Prediction | null>(null)

  useEffect(() => {
    api.get(`/dashboards/by-dataset/${id}`)
      .then(r => { setTitle(r.data.title); setConfig(r.data.config) })
      .catch(() => setNotReady(true))
      .finally(() => setLoading(false))
  }, [id])

  async function loadPreview() {
    if (!id) return
    if (preview) { setShowPreview(true); return }
    setPreviewLoading(true)
    try { const { data } = await api.get(`/datasets/${id}/preview`); setPreview(data); setShowPreview(true) }
    finally { setPreviewLoading(false) }
  }

  return (
    <Shell>
      {loading && <div style={{ fontSize: 14, color: '#6b6b6b' }}>Loading dashboard…</div>}
      {notReady && <div style={{ padding: '16px 20px', borderRadius: 12, background: '#fffbeb', border: '1.5px solid rgba(202,138,4,0.2)', fontSize: 14, color: '#92400e' }}>Dashboard is still generating — check back in a moment.</div>}
      {config && (
        <>
          {/* Hero */}
          <div style={{ borderRadius: 16, padding: '28px 32px', marginBottom: 24, background: '#0a0a0a', position: 'relative', overflow: 'hidden' }} className="hero-card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Auto-generated dashboard</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }} className="hero-title">{title}</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8, maxWidth: 480 }}>Numbers calculated directly from your file — not guessed.</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ label: 'Charts', value: config.charts.length }, { label: 'KPIs', value: config.kpi_cards.length }].map(s => (
                  <div key={s.label} style={{ borderRadius: 12, padding: '10px 18px', background: 'rgba(255,255,255,0.08)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                    <div className="font-mono-num" style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-actions" style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <ViewToggle mode={mode} onChange={setMode} />
              <button onClick={loadPreview}
                style={{ fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}>
                {previewLoading ? 'Loading…' : 'Preview raw data'}
              </button>
              {id && <ExportBtn datasetId={id} />}
              {id && <ShareButton datasetId={id} mode={mode} prediction={prediction} />}
            </div>
          </div>

          {mode === 'history' ? (
            <>
              {/* Labeled/unlabeled banner */}
              {config.data_structure && <StructureBanner ds={config.data_structure} />}

              {/* KPIs */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 12 }}>Key numbers</div>
              <KpiCards config={config} />

              {/* Charts */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>Visual breakdown</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 16 }}>Charts chosen automatically based on your data structure.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(420px,1fr))', gap: 16, marginBottom: 32 }} className="chart-grid">
                {config.charts.map((c, i) => <Chart key={i} chart={c} />)}
              </div>

              {/* Data quality */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 12 }}>Data health</div>
              <DataQualityPanel config={config} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>Prediction</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 16 }}>
                Tell the model what to predict. Every score it reports is measured on rows it did not train on.
              </div>
              {id && <PredictionSetup datasetId={id} onResult={setPrediction} />}
            </>
          )}

          {/* Preview modal */}
          {showPreview && preview && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1000, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} className="preview-modal">
                <button onClick={() => setShowPreview(false)} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: '#f3f3f3', cursor: 'pointer', color: '#0a0a0a', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: 16 }}>✕</button>
                <div style={{ padding: 24 }}><PreviewTable preview={preview} /></div>
              </div>
            </div>
          )}
        </>
      )}
    </Shell>
  )
}
