import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import Shell from '../components/Shell'
import { api, type ChartSpec, type DashboardConfig } from '../lib/api'

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
]

const card: React.CSSProperties = {
  borderRadius: 14,
  padding: '20px',
  background: '#fff',
  border: '1.5px solid var(--border)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
}

const tooltipStyle = {
  contentStyle: { borderRadius: 10, borderColor: 'var(--border)', background: '#fff', color: 'var(--text)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  labelStyle: { color: 'var(--text-muted)', fontWeight: 600 },
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{title}</div>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>}
    </div>
  )
}

function KpiCards({ config }: { config: DashboardConfig }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', marginBottom: 32 }}>
      {config.kpi_cards.map((k, i) => (
        <div key={k.metric} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }} />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 12 }}>
            {k.metric}
          </div>
          {k.growth_pct !== undefined && k.growth_pct !== null ? (
            <div className="font-mono-num" style={{ fontSize: 28, fontWeight: 800, color: k.growth_pct >= 0 ? 'var(--good)' : 'var(--bad)' }}>
              {k.growth_pct >= 0 ? '+' : ''}{k.growth_pct}%
            </div>
          ) : (
            <>
              <div className="font-mono-num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
                {k.sum?.toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                <span>avg {k.average?.toLocaleString()}</span>
                <span>n={k.count}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function ChartBadge({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)' }}>
      {label}
    </span>
  )
}

function Chart({ chart }: { chart: ChartSpec }) {
  if (chart.type === 'line' && chart.data) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Trend</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{chart.title}</div>
          </div>
          <ChartBadge label="Time series" />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chart.data}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={42} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="y" stroke="url(#lineGrad)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }
  if (chart.type === 'bar' && chart.data) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Distribution</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{chart.title}</div>
          </div>
          <ChartBadge label="Top 10" />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chart.data}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" angle={chart.data && chart.data.length > 6 ? -35 : 0} textAnchor={chart.data && chart.data.length > 6 ? 'end' : 'middle'} height={chart.data && chart.data.length > 6 ? 60 : 30} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={42} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
            <Bar dataKey="y" name="Value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  if (chart.type === 'top_bottom') {
    return (
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Ranking</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{chart.title}</div>
          </div>
          <ChartBadge label="Top / Bottom" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ borderRadius: 10, padding: 14, background: 'var(--good-light)', border: '1.5px solid rgba(16,185,129,0.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--good)', marginBottom: 10 }}>Top performers</div>
            {chart.top?.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(16,185,129,0.1)', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: 'var(--good)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{t.label}</span>
                </div>
                <span className="font-mono-num" style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{t.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 10, padding: 14, background: 'var(--bad-light)', border: '1.5px solid rgba(239,68,68,0.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--bad)', marginBottom: 10 }}>Bottom performers</div>
            {[...(chart.bottom ?? [])].reverse().map((t, i) => (
              <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(239,68,68,0.1)', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', color: 'var(--bad)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{t.label}</span>
                </div>
                <span className="font-mono-num" style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{t.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return null
}

function DataQualityPanel({ config }: { config: DashboardConfig }) {
  return (
    <div style={{ ...card, marginBottom: 32 }}>
      <SectionTitle title="Data quality & anomalies" subtitle="Issues that may affect confidence in this dashboard." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {[
          { label: `${config.data_quality.row_count} rows`, color: 'var(--accent)', bg: 'var(--accent-light)' },
          { label: `${config.data_quality.duplicate_row_count} duplicates`, color: '#d97706', bg: 'var(--warn-light)' },
          { label: `${config.data_quality.columns_with_missing.length} cols with missing`, color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
        ].map((b) => (
          <span key={b.label} style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, color: b.color, background: b.bg }}>
            {b.label}
          </span>
        ))}
      </div>
      {config.anomalies.length === 0 ? (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--good-light)', color: 'var(--good)', fontSize: 13, fontWeight: 600, border: '1.5px solid rgba(16,185,129,0.2)' }}>
          ✓ No significant anomalies detected.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {config.anomalies.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bad)' }}>{a.type}</div>
                {a.column && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.column}</div>}
              </div>
              <span className="font-mono-num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.count ?? a.value}</span>
            </div>
          ))}
        </div>
      )}
      {config.correlations.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '20px 0 10px' }}>Correlations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {config.correlations.map((c, i) => (
              <div key={i} className="font-mono-num" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{c.field_a} ↔ {c.field_b}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>r = {c.correlation}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

type PreviewData = {
  original_filename: string
  columns: string[]
  rows: Array<Record<string, unknown>>
  row_count: number
}

function PreviewTable({ preview }: { preview: PreviewData }) {
  return (
    <div style={{ ...card, marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Preview</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{preview.original_filename}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{preview.row_count} rows total · showing first {preview.rows.length}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Read-only</span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1.5px solid var(--border)' }}>
        <table style={{ minWidth: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-subtle)' }}>
            <tr>
              {preview.columns.map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--border)' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, ri) => (
              <tr key={ri} style={{ borderTop: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {preview.columns.map((col) => (
                  <td key={col} style={{ padding: '9px 14px', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DatasetDetailPage() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  useEffect(() => {
    api.get(`/dashboards/by-dataset/${id}`)
      .then((r) => { setTitle(r.data.title); setConfig(r.data.config) })
      .catch(() => setNotReady(true))
      .finally(() => setLoading(false))
  }, [id])

  async function loadPreview() {
    if (!id) return
    if (preview) { setShowPreview((v) => !v); return }
    setPreviewLoading(true)
    try {
      const { data } = await api.get(`/datasets/${id}/preview`)
      setPreview(data); setShowPreview(true)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <Shell>
      {loading && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading dashboard…</div>}
      {notReady && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No dashboard available for this dataset yet.</div>}
      {config && (
        <>
          {/* Hero */}
          <div style={{
            borderRadius: 16, padding: '28px 32px', marginBottom: 32,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%)',
            boxShadow: '0 8px 40px rgba(99,102,241,0.3)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: 100, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                  Auto-generated dashboard
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8, maxWidth: 520 }}>
                  One uploaded dataset powers this dashboard, its analytical answers, and future prediction runs.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ label: 'Charts', value: config.charts.length }, { label: 'KPIs', value: config.kpi_cards.length }].map((s) => (
                  <div key={s.label} style={{ borderRadius: 12, padding: '12px 20px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                    <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 4 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, alignItems: 'center', position: 'relative' }}>
              <button
                onClick={loadPreview}
                style={{ fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              >
                {previewLoading ? 'Loading…' : showPreview ? 'Hide preview' : 'Preview data'}
              </button>
              {['Dataset-linked', 'Model-ready'].map((tag) => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <SectionTitle title="Key metrics" subtitle="High-signal numbers extracted from your upload." />
          <KpiCards config={config} />

          <SectionTitle title="Visual analysis" subtitle="Charts automatically selected from the structure of the uploaded file." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 16, marginBottom: 32 }}>
            {config.charts.map((c, i) => <Chart key={i} chart={c} />)}
          </div>

          <SectionTitle title="Data quality" subtitle="Anomalies and correlations that deserve a closer look." />
          <DataQualityPanel config={config} />

          {showPreview && preview && <PreviewTable preview={preview} />}
        </>
      )}
    </Shell>
  )
}
