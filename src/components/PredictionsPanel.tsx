import type { Prediction } from '../lib/api'

function human(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/_growth_pct$/i, ' Growth').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}

const card: React.CSSProperties = {
  borderRadius: 14, padding: 20, background: '#fff',
  border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
}

const TITLE: Record<string, { text: string; icon: string }> = {
  clustering: { text: 'Groups in your data', icon: '🔍' },
  classification: { text: 'Category prediction', icon: '🎯' },
  regression: { text: 'Number prediction', icon: '📈' },
}

function Meter({ label, value, suffix = '%' }: { label: string; value: number; suffix?: string }) {
  const good = value >= (label.startsWith('Variance') ? 60 : 70)
  const color = good ? '#16a34a' : '#ca8a04'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span className="font-mono-num" style={{ fontSize: 13, fontWeight: 700, color }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 6, background: '#f3f3f3', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value))}%`, background: color, borderRadius: 6, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

/**
 * Renders a prediction result. Accuracy figures come from a held-out split, so
 * they describe the model on rows it never saw rather than on its own training
 * data - the label says so, because "99% accurate" means nothing without it.
 */
export default function PredictionsPanel({ p }: { p: Prediction }) {
  if (p.error) {
    return <div style={{ ...card, color: '#6b6b6b', fontSize: 13 }}>Prediction unavailable: {p.error}</div>
  }

  const heading = TITLE[p.model_type ?? 'regression'] ?? TITLE.regression

  return (
    <div style={{ ...card, marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>
        {heading.icon} {heading.text}
      </div>
      <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 4 }}>{p.algorithm}</div>
      {p.target_column && (
        <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 14 }}>
          Predicting <strong style={{ color: '#0a0a0a' }}>{human(p.target_column)}</strong> from{' '}
          {p.features_used?.length ?? 0} other column{(p.features_used?.length ?? 0) === 1 ? '' : 's'}
        </div>
      )}

      {p.insight && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f9f9f9', border: '1.5px solid #e8e8e8', fontSize: 13, color: '#0a0a0a', marginBottom: 16, lineHeight: 1.6 }}>
          {p.insight}
        </div>
      )}

      {/* Accuracy, measured on rows held back from training */}
      {p.accuracy_pct !== undefined && <Meter label="Prediction accuracy" value={p.accuracy_pct} />}
      {p.r2_pct !== undefined && <Meter label="Variance explained (R²)" value={p.r2_pct} />}

      {p.mean_absolute_error !== undefined && (
        <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: -6, marginBottom: 16 }}>
          On average the model is off by {p.mean_absolute_error.toLocaleString()}.
        </div>
      )}

      {/* Per-class accuracy: a single headline number hides the class a model
          is worst at, which is usually the one a user cares about. */}
      {p.per_class && p.per_class.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Accuracy per outcome</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.per_class.map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#0a0a0a', minWidth: 90, fontWeight: 600 }}>{human(c.label)}</span>
                <div style={{ flex: 1, height: 5, background: '#f3f3f3', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.accuracy_pct}%`, background: c.accuracy_pct >= 70 ? '#16a34a' : '#ca8a04', borderRadius: 5 }} />
                </div>
                <span className="font-mono-num" style={{ fontSize: 11, color: '#6b6b6b', minWidth: 40, textAlign: 'right' }}>{c.accuracy_pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#a8a8a8', marginTop: 6 }}>
            Measured on held-out rows, not the rows the model learned from.
          </div>
        </div>
      )}

      {/* What drives the prediction */}
      {p.feature_importance && p.feature_importance.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>What drives the prediction</div>
          <div style={{ fontSize: 11, color: '#a8a8a8', marginBottom: 10 }}>
            Longer bar = the model leans on that column more.
          </div>
          {p.feature_importance.map((f, i) => (
            <div key={f.feature} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: '#0a0a0a' }}>{human(f.feature)}</span>
                <span className="font-mono-num" style={{ color: '#6b6b6b' }}>{(f.importance * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 4, background: '#f3f3f3', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${f.importance * 100}%`, background: i === 0 ? '#0a0a0a' : '#a8a8a8', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clusters, described by what actually distinguishes them */}
      {p.cluster_sizes && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Groups found in your data</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.cluster_sizes.map((c) => {
              const notes = p.cluster_profiles?.find(x => x.cluster === c.cluster)?.notable
              return (
                <div key={c.cluster} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', borderRadius: 9, background: '#f9f9f9', border: '1.5px solid #e8e8e8' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{c.cluster}</div>
                    {notes && notes.length > 0 && (
                      <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 2 }}>
                        {notes.map(n => human(n)).join(' · ')}
                      </div>
                    )}
                  </div>
                  <div className="font-mono-num" style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', flexShrink: 0 }}>
                    {c.count.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sample predictions vs actual */}
      {p.sample_predictions && p.sample_predictions.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Sample predictions vs actual</div>
          <div style={{ fontSize: 11, color: '#a8a8a8', marginBottom: 10 }}>Rows the model had not seen while learning.</div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1.5px solid #e8e8e8' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9f9f9' }}>
                <tr>
                  {['Actual', 'Predicted', 'Off by'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b6b6b', borderBottom: '1.5px solid #e8e8e8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.sample_predictions.map((r, i) => {
                  const pct = r.actual !== 0 ? (Math.abs(r.actual - r.predicted) / Math.abs(r.actual) * 100).toFixed(1) : '—'
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #e8e8e8' }}>
                      <td className="font-mono-num" style={{ padding: '7px 12px' }}>{r.actual.toLocaleString()}</td>
                      <td className="font-mono-num" style={{ padding: '7px 12px' }}>{r.predicted.toLocaleString()}</td>
                      <td className="font-mono-num" style={{ padding: '7px 12px', color: '#6b6b6b' }}>{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
