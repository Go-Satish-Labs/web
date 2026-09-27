import { useEffect } from 'react'

type Phase = 'launching' | 'flying' | 'landed'

interface Props {
  phase: Phase
  onClose: () => void
  onLanded?: () => void
}

const MSG = {
  launching: { title: 'Launching 🚀',  sub: 'Preparing your file…'  },
  flying:    { title: 'Uploading…',     sub: 'Sending to the server' },
  landed:    { title: 'Landed! ✓',      sub: 'Opening your dashboard…' },
}

export default function RocketDialog({ phase, onClose, onLanded }: Props) {
  useEffect(() => {
    if (phase !== 'landed') return
    const t = setTimeout(() => { onLanded?.(); onClose() }, 1800)
    return () => clearTimeout(t)
  }, [phase, onClose, onLanded])

  const progress = phase === 'launching' ? '30%' : phase === 'flying' ? '72%' : '100%'
  const rocketY  = phase === 'flying' ? -54 : 0

  return (
    <>
      {/* backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'rdFadeIn 0.2s ease both',
      }} />

      {/* centering wrapper — never animated, just positions */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {/* animated card */}
        <div style={{
          width: 300,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.1)',
          border: '1.5px solid #e8e8e8',
          overflow: 'hidden',
          pointerEvents: 'all',
          animation: 'rdSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both',
        }}>

          {/* scene */}
          <div style={{
            height: 140, background: '#0a0a0a',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* stars */}
            {[...Array(22)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: i % 4 === 0 ? 2.5 : 1.5,
                height: i % 4 === 0 ? 2.5 : 1.5,
                borderRadius: '50%',
                background: '#fff',
                opacity: 0.3 + (i % 5) * 0.12,
                top: `${6 + (i * 19) % 72}%`,
                left: `${4 + (i * 27) % 92}%`,
                animation: `rdTwinkle ${1.0 + (i % 6) * 0.35}s ease-in-out ${(i % 8) * 0.25}s infinite alternate`,
              }} />
            ))}

            {/* moon */}
            <div style={{
              position: 'absolute', top: 14, right: 32,
              width: 26, height: 26, borderRadius: '50%',
              background: '#f0f0f0',
              boxShadow: 'inset -5px -3px 0 rgba(0,0,0,0.12)',
              transition: 'transform 1s ease',
              transform: phase === 'flying' ? 'scale(1.2)' : 'scale(1)',
            }} />

            {/* rocket wrapper — animates Y */}
            <div style={{
              position: 'relative', zIndex: 2, marginBottom: 10,
              transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)',
              transform: `translateY(${rocketY}px)`,
            }}>
              <svg width="36" height="58" viewBox="0 0 60 90" fill="none">
                <path d="M14 74 L6 86 L14 86 Z" fill="#d0d0d0"/>
                <path d="M46 74 L54 86 L46 86 Z" fill="#d0d0d0"/>
                <path d="M30 4 L50 26 L50 74 L38 74 L38 44 L22 44 L22 74 L10 74 L10 26 Z" fill="#ffffff"/>
                <path d="M30 4 L50 26 L50 74 L38 74 L38 44 L22 44 L22 74 L10 74 L10 26 Z" stroke="#e8e8e8" strokeWidth="1.5"/>
                <circle cx="30" cy="20" r="7" fill="#0a0a0a"/>
                <circle cx="27" cy="17" r="2" fill="#ffffff" opacity="0.6"/>
                {phase !== 'landed' && (
                  <>
                    <path d="M22 74 Q30 112 38 74 Z" fill="url(#fg)"
                      style={{ animation: 'rdFlicker 0.12s ease-in-out infinite alternate' }}/>
                    <path d="M26 74 Q30 96 34 74 Z" fill="#fef9c3" opacity="0.9"/>
                  </>
                )}
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#fde68a"/>
                    <stop offset="50%"  stopColor="#f97316"/>
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* launch pad */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: 52, height: 7,
              background: '#2a2a2a', borderRadius: '4px 4px 0 0',
            }}/>

            {/* exhaust puff */}
            {phase !== 'landed' && (
              <div style={{
                position: 'absolute', bottom: 7, left: '50%',
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                animation: 'rdPuff 0.55s ease-out infinite',
              }}/>
            )}
          </div>

          {/* text + progress */}
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 3 }}>
              {MSG[phase].title}
            </div>
            <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 14 }}>
              {MSG[phase].sub}
            </div>
            <div style={{ height: 5, background: '#f3f3f3', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: progress,
                background: phase === 'landed' ? '#16a34a' : '#0a0a0a',
                borderRadius: 5,
                transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1), background 0.3s',
              }}/>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rdFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes rdSlideUp { from{opacity:0;transform:translateY(28px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes rdTwinkle { from{opacity:0.15} to{opacity:0.95} }
        @keyframes rdFlicker { from{opacity:0.75;transform:scaleX(0.88)} to{opacity:1;transform:scaleX(1.12)} }
        @keyframes rdPuff    { from{transform:translateX(-50%) scale(0.4);opacity:0.5} to{transform:translateX(-50%) scale(2.8);opacity:0} }
      `}</style>
    </>
  )
}
