import { useEffect, useRef, useState } from 'react'
import Shell from '../components/Shell'
import { api, apiErrorMessage, type Dataset } from '../lib/api'

interface ChatMessage { role: 'user' | 'assistant'; content: string; disclaimer?: string }

export default function AskDataPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [datasetId, setDatasetId] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/datasets').then((r) => {
      const analyzed = r.data.filter((d: Dataset) => d.status === 'analyzed')
      setDatasets(analyzed)
      if (analyzed.length > 0) setDatasetId(analyzed[0].id)
    })
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function ask() {
    if (!question.trim() || !datasetId) return
    setError(''); setBusy(true)
    const userMsg: ChatMessage = { role: 'user', content: question }
    setMessages((m) => [...m, userMsg]); setQuestion('')
    try {
      const { data } = await api.post('/ai/ask', { dataset_id: datasetId, question: userMsg.content })
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, disclaimer: data.disclaimer }])
      setRemaining(data.remaining_ai_questions)
    } catch (err) { setError(apiErrorMessage(err)) }
    finally { setBusy(false) }
  }

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }}>Ask your data</h1>
        <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 6 }}>Answers are grounded in your data — the AI explains numbers, never invents them.</p>
      </div>

      {datasets.length === 0 ? (
        <div style={{ borderRadius: 14, padding: '48px 40px', textAlign: 'center', background: '#ffffff', border: '2px dashed #e8e8e8', color: '#6b6b6b', fontSize: 14 }}>
          Upload and analyze a dataset first to start asking questions.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', minHeight: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)}
              style={{ padding: '9px 14px', fontSize: 13, fontWeight: 500, borderRadius: 10, minWidth: 220 }}>
              {datasets.map((d) => <option key={d.id} value={d.id}>{d.original_filename}</option>)}
            </select>
            {remaining !== null && (
              <span style={{ fontSize: 12, color: '#6b6b6b' }}>
                <span className="font-mono-num" style={{ color: remaining < 5 ? '#dc2626' : '#0a0a0a', fontWeight: 700 }}>{remaining}</span> AI questions left
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', borderRadius: 12, padding: '20px', background: '#ffffff', border: '1.5px solid #e8e8e8', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
            {messages.length === 0 && (
              <div style={{ color: '#a8a8a8', fontSize: 14, textAlign: 'center', margin: 'auto' }}>
                Try: "What is the total sales?", "Any anomalies?", "How many rows?"
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '78%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    background: m.role === 'user' ? '#0a0a0a' : '#f3f3f3',
                    color: m.role === 'user' ? '#fff' : '#0a0a0a',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12,
                  }}>{m.content}</div>
                  {m.disclaimer && <div style={{ fontSize: 11, color: '#a8a8a8', marginTop: 4, paddingLeft: 4 }}>{m.disclaimer}</div>}
                </div>
              </div>
            ))}
            {busy && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: 12, borderBottomLeftRadius: 4, fontSize: 14, background: '#f3f3f3', color: '#6b6b6b' }}>Thinking…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={question} onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && ask()}
              placeholder="Ask a question about this dataset…"
              style={{ flex: 1, padding: '11px 14px', fontSize: 14, borderRadius: 10 }} disabled={busy} />
            <button onClick={ask} disabled={busy || !question.trim()}
              style={{ padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', background: '#0a0a0a', border: 'none', opacity: busy || !question.trim() ? 0.4 : 1, transition: 'opacity 0.15s' }}>
              Send
            </button>
          </div>
        </div>
      )}
    </Shell>
  )
}
