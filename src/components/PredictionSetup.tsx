import { useEffect, useState } from 'react'
import PredictionsPanel from './PredictionsPanel'
import { api, type PredictOptions, type Prediction } from '../lib/api'
import { friendlyError } from '../lib/errors'

function human(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** What the "what kind of prediction" options mean, in plain words. */
const GOALS = [
  { mode: 'regression', label: 'Predict a number', blurb: 'e.g. next month’s revenue' },
  { mode: 'classification', label: 'Predict a category', blurb: 'e.g. churned or stayed' },
  { mode: 'clustering', label: 'Group similar rows', blurb: 'no target needed' },
]

/**
 * Column picker for the Prediction tab.
 *
 * The default dashboard picks a target on the user's behalf, which is wrong
 * often enough to be misleading. This asks instead, and offers clustering
 * when the data has no obvious answer column rather than forcing a target the
 * file does not really have.
 */
export default function PredictionSetup({ datasetId, onResult }: {
  datasetId: string
  onResult?: (p: Prediction | null) => void
}) {
  const [options, setOptions] = useState<PredictOptions | null>(null)
  const [mode, setMode] = useState<string>('regression')
  const [target, setTarget] = useState<string>('')
  const [features, setFeatures] = useState<string[]>([])
  const [nClusters, setNClusters] = useState(4)
  const [result, setResult] = useState<Prediction | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get<PredictOptions>(`/dashboards/predict-options/${datasetId}`)
      .then(({ data }) => {
        if (cancelled) return
        setOptions(data)
        setTarget(data.suggested_target ?? '')
        // Unlabeled data has nothing meaningful to predict by default, so
        // clustering is the honest starting point rather than a guess.
        setMode(data.suggested_mode === 'clustering' ? 'clustering' : 'regression')
        setFeatures(
          (data.numeric_columns.filter(c => c !== data.suggested_target)).slice(0, 6)
        )
      })
      .catch((e) => { if (!cancelled) setError(friendlyError(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [datasetId])

  function toggleFeature(col: string) {
    setFeatures(f => f.includes(col) ? f.filter(c => c !== col) : [...f, col])
  }

  async function run() {
    setError(''); setBusy(true)
    try {
      const { data } = await api.post('/dashboards/predict', {
        dataset_id: datasetId,
        target: mode === 'clustering' ? null : target || null,
        features: mode === 'clustering' ? [] : features,
        mode,
        n_clusters: mode === 'clustering' ? nClusters : undefined,
      })
      setResult(data.prediction)
      onResult?.(data.prediction)
    } catch (e) {
      setError(friendlyError(e))
    } finally { setBusy(false) }
  }

  if (loading) {
    return <div style={{ ...panel, color: '#6b6b6b', fontSize: 13 }}>Loading your columns…</div>
  }
  if (!options) {
    return <div style={{ ...panel, color: '#dc2626', fontSize: 13 }}>{error || 'Could not read this dataset.'}</div>
  }

  const canRun = mode === 'clustering' || (!!target && features.length > 0)
  const allColumns = [...options.numeric_columns, ...options.categorical_columns]

  return (
    <div style={panel}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>
        What would you like to predict?
      </div>
      <div style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 18 }}>
        {options.hint}
      </div>

      {/* Step 1 - the kind of prediction */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 8 }}>
        1 · What kind of answer
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 8, marginBottom: 20 }}>
        {GOALS.filter(g => g.mode !== 'clustering' || options.clusterable).map(g => {
          const active = mode === g.mode
          return (
            <button key={g.mode} onClick={() => setMode(g.mode)}
              style={{
                padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                border: `1.5px solid ${active ? '#0a0a0a' : '#e8e8e8'}`,
                background: active ? '#0a0a0a' : '#fff',
                color: active ? '#fff' : '#0a0a0a',
                transition: 'all 0.15s ease',
              }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{g.label}</div>
              <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.6)' : '#a8a8a8' }}>{g.blurb}</div>
            </button>
          )
        })}
      </div>

      {mode === 'clustering' ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 8 }}>
            2 · How many groups
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setNClusters(n)}
                style={{
                  padding: '7px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${nClusters === n ? '#0a0a0a' : '#e8e8e8'}`,
                  background: nClusters === n ? '#0a0a0a' : '#fff',
                  color: nClusters === n ? '#fff' : '#0a0a0a',
                }}>
                {n}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#a8a8a8' }}>
            We will look at {options.numeric_columns.slice(0, 6).length} numeric columns and split
            your rows into {nClusters} groups that behave alike.
          </div>
        </>
      ) : (
        <>
          {/* Step 2 - target */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 8 }}>
            2 · The column to predict
          </div>
          <select value={target} onChange={(e) => setTarget(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 9, marginBottom: 20, border: '1.5px solid #e8e8e8' }}>
            <option value="">— choose a column —</option>
            {allColumns.map(c => <option key={c} value={c}>{human(c)}</option>)}
          </select>

          {/* Step 3 - inputs */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 8 }}>
            3 · Columns it learns from {features.length > 0 && `(${features.length} selected)`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {allColumns.filter(c => c !== target).map(c => {
              const on = features.includes(c)
              return (
                <button key={c} onClick={() => toggleFeature(c)}
                  style={{
                    padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${on ? '#0a0a0a' : '#e8e8e8'}`,
                    background: on ? '#0a0a0a' : '#fff',
                    color: on ? '#fff' : '#6b6b6b',
                    transition: 'all 0.12s ease',
                  }}>
                  {on ? '✓ ' : ''}{human(c)}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 16 }}>
            Pick at least one column other than the one you want predicted.
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={run} disabled={busy || !canRun}
          style={{
            padding: '11px 22px', borderRadius: 10, border: 'none', cursor: busy || !canRun ? 'not-allowed' : 'pointer',
            background: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 700, opacity: busy || !canRun ? 0.4 : 1,
          }}>
          {busy ? 'Running…' : 'Run prediction'}
        </button>
        {result && (
          <button onClick={() => { setResult(null); onResult?.(null); setError('') }}
            style={{ padding: '11px 16px', borderRadius: 10, cursor: 'pointer', background: '#fff', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: '1.5px solid #e8e8e8' }}>
            Change columns
          </button>
        )}
      </div>

      {!canRun && !busy && (
        <div style={{ fontSize: 12, color: '#a8a8a8', marginTop: 10 }}>
          {mode === 'clustering' ? 'Grouping needs at least two numeric columns.' : 'Choose a target and at least one input column to continue.'}
        </div>
      )}
      {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 10 }}>{error}</div>}
      {result?.error && (
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 9, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', fontSize: 12 }}>
          {result.error}
        </div>
      )}
      {result && !result.error && <PredictionsPanel p={result} />}
    </div>
  )
}

const panel: React.CSSProperties = {
  borderRadius: 14, padding: 20, background: '#fff',
  border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
}
