import { useEffect, useRef, useState } from 'react'
import Shell from '../components/Shell'
import ForecastChart, { INTENT_LABELS } from '../components/ForecastChart'
import { friendlyError } from '../lib/errors'
import {
  api,
  type AskResponse, type Dataset, type Forecast, type AskInterpretation,
} from '../lib/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  disclaimer?: string
  interpretation?: AskInterpretation | null
  forecast?: Forecast | null
}

const EXAMPLES = [
  'will sales increase in the next 10 days?',
  'what is the total revenue?',
  'which region has the highest units?',
  'is there a relationship between price and units?',
  'what problems does this data have?',
]

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
      const { data } = await api.post<AskResponse>('/ai/ask', { dataset_id: datasetId, question: userMsg.content })
      setMessages((m) => [...m, {
        role: 'assistant',
        content: data.answer,
        disclaimer: data.disclaimer,
        interpretation: data.interpretation,
        forecast: data.forecast,
      }])
      setRemaining(data.remaining_ai_questions)
    } catch (err) { setError(friendlyError(err)) }
    finally { setBusy(false) }
  }

  return (
    <Shell>
      <div className="page-enter">
        <div className="rise" style={{ '--i': 0 } as React.CSSProperties}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Ask your data</h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', margin: '0 0 24px' }}>Ask in plain language. Every number is calculated from your data — the AI only explains it.</p>
        </div>

        {datasets.length === 0 ? (
          <div className="rise" style={{ '--i': 1, borderRadius: 14, padding: '48px 40px', textAlign: 'center', background: '#ffffff', border: '2px dashed #e8e8e8', color: '#6b6b6b', fontSize: 14 } as React.CSSProperties}>
            Upload and analyze a dataset first to start asking questions.
          </div>
        ) : (
          <div className="ask-layout rise" style={{ '--i': 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', minHeight: 400 } as React.CSSProperties}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
              <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)}
                className="input-base"
                style={{ padding: '9px 14px', fontSize: 13, fontWeight: 500, borderRadius: 10, minWidth: 220 }}>
                {datasets.map((d) => <option key={d.id} value={d.id}>{d.original_filename}</option>)}
              </select>
              {remaining !== null && (
                <span style={{ fontSize: 12, color: '#6b6b6b' }}>
                  <span className="font-mono-num" style={{ color: remaining < 5 ? '#dc2626' : '#0a0a0a', fontWeight: 700 }}>{remaining}</span> AI questions left
                </span>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', borderRadius: 12, padding: '20px', background: '#ffffff', border: '1.5px solid #e8e8e8', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
              {messages.length === 0 && (
                <div style={{ margin: 'auto', maxWidth: 420, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a', marginBottom: 4 }}>What would you like to know?</div>
                  <div style={{ fontSize: 12, color: '#a8a8a8', marginBottom: 14 }}>Pick one to try:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {EXAMPLES.map(q => (
                      <button key={q} onClick={() => setQuestion(q)} className="btn-base row-hover"
                        style={{ padding: '8px 12px', borderRadius: 9, fontSize: 13, textAlign: 'left', border: '1.5px solid #e8e8e8', background: '#fafafa', color: '#0a0a0a', cursor: 'pointer' }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className="rise" style={{ '--i': i % 5, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' } as React.CSSProperties}>
                  <div style={{ maxWidth: m.role === 'user' ? '78%' : '88%', minWidth: 0 }}>
                    {m.role === 'assistant' && m.interpretation?.metric && m.interpretation.intent !== 'unknown' && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: '#6b6b6b', background: '#f3f3f3', padding: '3px 9px', borderRadius: 999 }}>
                        <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{INTENT_LABELS[m.interpretation.intent] ?? m.interpretation.intent}</span>
                        {m.interpretation.metric && <span>· {m.interpretation.metric}</span>}
                        {m.interpretation.horizon && <span>· next {m.interpretation.horizon} {m.interpretation.horizon_unit}</span>}
                      </div>
                    )}
                    <div style={{ padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: m.role === 'user' ? '#0a0a0a' : '#f3f3f3', color: m.role === 'user' ? '#fff' : '#0a0a0a', borderBottomRightRadius: m.role === 'user' ? 4 : 12, borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12 }}>{m.content}</div>
                    {m.forecast && <ForecastChart forecast={m.forecast} />}
                    {m.disclaimer && <div style={{ fontSize: 11, color: '#a8a8a8', marginTop: 6, paddingLeft: 4 }}>{m.disclaimer}</div>}
                  </div>
                </div>
              ))}
              {busy && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div className="pop-in" style={{ padding: '10px 14px', borderRadius: 12, borderBottomLeftRadius: 4, fontSize: 14, background: '#f3f3f3', color: '#6b6b6b' }}>Working it out…</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <div className="shake" style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <input data-tour="ask-input" value={question} onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && ask()}
                placeholder="Ask a question about this dataset…" className="input-base"
                style={{ flex: 1, padding: '11px 14px', fontSize: 14, borderRadius: 10 }} disabled={busy} />
              <button onClick={ask} disabled={busy || !question.trim()} className="btn-base btn-solid">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
