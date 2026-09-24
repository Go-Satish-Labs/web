import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuotaBar from '../components/QuotaBar'
import Shell from '../components/Shell'
import { api, apiErrorMessage, type Dataset } from '../lib/api'

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  analyzed: { label: 'Analyzed',  color: '#16a34a', bg: '#f0fdf4', border: 'rgba(22,163,74,0.2)' },
  profiled:  { label: 'Profiling', color: '#ca8a04', bg: '#fefce8', border: 'rgba(202,138,4,0.2)' },
  uploaded:  { label: 'Uploaded',  color: '#6b6b6b', bg: '#f3f3f3', border: '#e8e8e8' },
  error:     { label: 'Error',     color: '#dc2626', bg: '#fef2f2', border: 'rgba(220,38,38,0.2)' },
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try { const { data } = await api.get('/datasets'); setDatasets(data) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function onFileChosen(file: File) {
    setError(''); setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/datasets', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      await load(); navigate(`/datasets/${data.id}`)
    } catch (err) { setError(apiErrorMessage(err)) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function onDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this dataset and its dashboard?')) return
    await api.delete(`/datasets/${id}`); await load()
  }

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }}>Datasets</h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 6 }}>Upload a CSV or Excel file to generate an automatic dashboard.</p>
        </div>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          color: '#fff', background: uploading ? '#a8a8a8' : '#0a0a0a',
          cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0,
          transition: 'background 0.15s',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {uploading ? 'Uploading…' : 'Upload dataset'}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} disabled={uploading}
            onChange={(e) => e.target.files?.[0] && onFileChosen(e.target.files[0])} />
        </label>
      </div>

      <QuotaBar />

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16, background: '#fef2f2', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.15)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ height: 66, borderRadius: 12, background: '#f3f3f3', border: '1.5px solid #e8e8e8' }} />)}
        </div>
      ) : datasets.length === 0 ? (
        <div style={{ borderRadius: 14, padding: '60px 40px', textAlign: 'center', background: '#ffffff', border: '2px dashed #e8e8e8' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>No datasets yet</div>
          <div style={{ fontSize: 13, color: '#6b6b6b' }}>Upload a CSV or XLSX file to get KPIs, charts, and anomaly detection.</div>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1.5px solid #e8e8e8', overflow: 'hidden', background: '#ffffff' }}>
          {datasets.map((d, i) => {
            const s = STATUS[d.status] ?? STATUS.uploaded
            const clickable = d.status === 'analyzed'
            return (
              <div key={d.id} onClick={() => clickable && navigate(`/datasets/${d.id}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', fontSize: 14, borderTop: i === 0 ? 'none' : '1.5px solid #e8e8e8', cursor: clickable ? 'pointer' : 'default', transition: 'background 0.12s' }}
                onMouseEnter={(e) => { if (clickable) e.currentTarget.style.background = '#f9f9f9' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: '#f3f3f3', border: '1.5px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.original_filename}</div>
                    <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>
                      {d.row_count} rows · {d.column_count} cols{d.detected_category ? ` · ${d.detected_category}` : ''}{d.error_message ? ` · ${d.error_message}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>{s.label}</span>
                  <button onClick={(e) => onDelete(d.id, e)}
                    style={{ fontSize: 12, fontWeight: 500, color: '#6b6b6b', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6, transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6b6b'; e.currentTarget.style.background = 'none' }}
                  >Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Shell>
  )
}
