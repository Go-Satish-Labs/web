import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuotaBar from '../components/QuotaBar'
import RocketDialog from '../components/RocketDialog'
import RetentionNotice, { RetentionTag } from '../components/RetentionNotice'
import Shell from '../components/Shell'
import { api, apiErrorMessage, type Dataset } from '../lib/api'

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  analyzed: { label: 'Ready',     color: '#16a34a', bg: '#f0fdf4', border: 'rgba(22,163,74,0.2)' },
  profiled:  { label: 'Profiling', color: '#ca8a04', bg: '#fefce8', border: 'rgba(202,138,4,0.2)' },
  uploaded:  { label: 'Processing',color: '#6b6b6b', bg: '#f3f3f3', border: '#e8e8e8' },
  error:     { label: 'Error',     color: '#dc2626', bg: '#fef2f2', border: 'rgba(220,38,38,0.2)' },
}

type RocketPhase = 'launching' | 'flying' | 'landed'

export default function DatasetsPage() {
  const [datasets, setDatasets]   = useState<Dataset[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [rocket, setRocket]       = useState<RocketPhase | null>(null)
  const [dupToast, setDupToast]   = useState('')
  const [error, setError]         = useState('')
  const uploadedIdRef             = useRef<string | null>(null)
  const fileRef                   = useRef<HTMLInputElement>(null)
  const navigate                  = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try { const { data } = await api.get('/datasets'); setDatasets(data) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  /* Poll until the just-uploaded dataset is analyzed, then navigate */
  async function pollAndNavigate(datasetId: string) {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const { data } = await api.get('/datasets')
        const ds: Dataset = data.find((d: Dataset) => d.id === datasetId)
        if (ds?.status === 'analyzed') {
          navigate(`/datasets/${datasetId}`)
          return
        }
        if (ds?.status === 'error') break
      } catch { break }
    }
    // fallback: just refresh the list
    await load()
  }

  function pickFile() {
    if (!uploading) fileRef.current?.click()
  }

  async function onFileChosen(file: File) {
    setError('')
    setDupToast('')

    const existing = datasets.find(
      d => d.original_filename.toLowerCase() === file.name.toLowerCase()
    )
    if (existing) {
      setDupToast(`"${file.name}" already exists. Rename the file if the contents differ.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)
    setRocket('launching')
    const form = new FormData()
    form.append('file', file)

    try {
      await new Promise(r => setTimeout(r, 500))
      setRocket('flying')
      const { data } = await api.post('/datasets', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      uploadedIdRef.current = data.id ?? null
      setRocket('landed')
      // onLanded callback (from RocketDialog) will trigger pollAndNavigate
    } catch (err) {
      setRocket(null)
      setError(apiErrorMessage(err))
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleLanded() {
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (uploadedIdRef.current) {
      pollAndNavigate(uploadedIdRef.current)
    } else {
      load()
    }
  }

  // Inline two-step confirmation instead of window.confirm, and the error is
  // surfaced: previously a failed DELETE rejected unhandled, the reload never
  // ran, and the row just sat there looking like nothing had happened.
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function onDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleteError('')
    if (confirmingId !== id) {
      setConfirmingId(id)
      return
    }
    setDeletingId(id)
    try {
      await api.delete(`/datasets/${id}`)
      setConfirmingId(null)
      await load()
    } catch (err) {
      setDeleteError(apiErrorMessage(err))
      setConfirmingId(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Shell>
      {/* header */}
      <div className="dataset-title-bar" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }}>Datasets</h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 6 }}>Upload a CSV or Excel file — a dashboard is generated automatically.</p>
        </div>
        <button onClick={pickFile} disabled={uploading} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          color: '#fff', background: uploading ? '#a8a8a8' : '#0a0a0a',
          border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {uploading ? 'Uploading…' : 'Upload dataset'}
        </button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
          disabled={uploading} onChange={e => e.target.files?.[0] && onFileChosen(e.target.files[0])} />
      </div>

      <QuotaBar />

      {/* privacy notice - copy comes from the server so it matches the real window */}
      <RetentionNotice />

      {/* duplicate warning */}
      {dupToast && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16,
          background: '#fffbeb', color: '#92400e', border: '1.5px solid rgba(202,138,4,0.25)',
        }}>
          <span>⚠️ {dupToast}</span>
          <button onClick={() => setDupToast('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* upload error */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16, background: '#fef2f2', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.15)' }}>
          {error}
        </div>
      )}

      {/* delete error */}
      {deleteError && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16, background: '#fef2f2', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>Could not delete: {deleteError}</span>
          <button onClick={() => setDeleteError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* rocket */}
      {rocket && (
        <RocketDialog
          phase={rocket}
          onClose={() => setRocket(null)}
          onLanded={handleLanded}
        />
      )}

      {/* list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 12, background: '#f3f3f3', border: '1.5px solid #e8e8e8' }} />)}
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
            const ready = d.status === 'analyzed'
            return (
              <div key={d.id} className="dataset-row"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', fontSize: 14,
                  borderTop: i === 0 ? 'none' : '1.5px solid #e8e8e8',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (ready) e.currentTarget.style.background = '#f9f9f9' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {/* left: icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: '#f3f3f3', border: '1.5px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.original_filename}</div>
                    <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>
                      {d.row_count > 0 ? `${d.row_count.toLocaleString()} rows · ${d.column_count} cols` : 'Processing…'}
                      {d.detected_category && d.detected_category !== 'generic' ? ` · ${d.detected_category}` : ''}
                      {d.error_message ? ` · ${d.error_message}` : ''}
                    </div>
                  </div>
                </div>

                {/* right: status + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 16 }}>
                  <RetentionTag hours={d.hours_until_deletion} />
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                    {s.label}
                  </span>

                  {ready ? (
                    <button
                      onClick={() => navigate(`/datasets/${d.id}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                        background: '#0a0a0a', color: '#fff', border: 'none', cursor: 'pointer',
                        transition: 'background 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#0a0a0a')}
                    >
                      View dashboard
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: '#a8a8a8' }}>
                      {d.status === 'error' ? 'Failed' : 'Generating…'}
                    </span>
                  )}

                  {confirmingId === d.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, color: '#92400e' }}>Delete this file?</span>
                      <button
                        onClick={e => onDelete(d.id, e)}
                        disabled={deletingId === d.id}
                        style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#dc2626', border: 'none', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', opacity: deletingId === d.id ? 0.6 : 1 }}
                      >
                        {deletingId === d.id ? 'Deleting…' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmingId(null) }}
                        style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', background: '#fff', border: '1.5px solid #e8e8e8', padding: '5px 12px', borderRadius: 8, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={e => onDelete(d.id, e)}
                      aria-label={`Delete ${d.original_filename}`}
                      style={{ fontSize: 12, fontWeight: 500, color: '#a8a8a8', background: 'none', border: 'none', padding: '4px 6px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#a8a8a8'; e.currentTarget.style.background = 'none' }}
                    >Delete</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Shell>
  )
}
