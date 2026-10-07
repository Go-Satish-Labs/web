import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export const TOUR_STORAGE_PREFIX = 'analytrix:onboarding:'

type TourStep = {
  route: string
  target: string
  title: string
  body: string
}

const steps: TourStep[] = [
  {
    route: '/datasets',
    target: '[data-tour="datasets-nav"]',
    title: 'Your datasets',
    body: 'This is your starting point. Upload a CSV or Excel file here to generate an analytics dashboard.',
  },
  {
    route: '/datasets',
    target: '[data-tour="upload-dataset"]',
    title: 'Upload a dataset',
    body: 'Choose Upload dataset and select a file. We will process it and build your dashboard automatically.',
  },
  {
    route: '/ask',
    target: '[data-tour="ask-nav"]',
    title: 'Ask your data',
    body: 'Once a dataset is ready, open Ask Data to ask questions in plain language.',
  },
  {
    route: '/ask',
    target: '[data-tour="ask-input"]',
    title: 'Ask a question',
    body: 'Select a dataset, type your question, and send it. You can return to Datasets at any time.',
  },
]

function storageKey(userId: string) {
  return `${TOUR_STORAGE_PREFIX}${userId}`
}

export function markTourReady(userId: string) {
  window.localStorage.setItem(storageKey(userId), 'pending')
  window.dispatchEvent(new Event('analytrix:onboarding-ready'))
}

export default function OnboardingTour() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user) {
      setVisible(false)
      return
    }

    const key = storageKey(user.id)
    const status = window.localStorage.getItem(key)
    if (!status && !user.hasSecurityQuestion) window.localStorage.setItem(key, 'settings-required')
    if ((status === 'pending' || status === 'active') && user.hasSecurityQuestion) {
      window.localStorage.setItem(key, 'active')
      setVisible(true)
    }

    const refresh = () => {
      if (window.localStorage.getItem(key) === 'pending' && user.hasSecurityQuestion) {
        window.localStorage.setItem(key, 'active')
        setStepIndex(0)
        setVisible(true)
      }
    }
    window.addEventListener('analytrix:onboarding-ready', refresh)
    return () => window.removeEventListener('analytrix:onboarding-ready', refresh)
  }, [user])

  useEffect(() => {
    if (!visible) return
    const step = steps[stepIndex]
    if (location.pathname !== step.route) navigate(step.route)
  }, [location.pathname, navigate, stepIndex, visible])

  if (!visible || !user) return null

  const step = steps[stepIndex]
  const target = document.querySelector(step.target)
  const rect = target?.getBoundingClientRect()
  const isLast = stepIndex === steps.length - 1
  const userId = user.id

  function finish() {
    window.localStorage.setItem(storageKey(userId), 'completed')
    setVisible(false)
  }

  function next() {
    if (isLast) {
      finish()
      return
    }
    setStepIndex((current) => current + 1)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.46)' }} />
      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          border: '2px solid #fff',
          borderRadius: 10,
          boxShadow: '0 0 0 9999px rgba(0,0,0,.46), 0 0 0 4px rgba(255,255,255,.25)',
        }} />
      )}
      <div style={{
        position: 'fixed',
        left: '50%',
        bottom: 32,
        transform: 'translateX(-50%)',
        width: 'min(360px, calc(100vw - 32px))',
        padding: 20,
        borderRadius: 14,
        background: '#fff',
        color: '#0a0a0a',
        boxShadow: '0 18px 50px rgba(0,0,0,.28)',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Getting started · {stepIndex + 1}/{steps.length}
            </div>
            <h2 style={{ margin: '8px 0 6px', fontSize: 19 }}>{step.title}</h2>
          </div>
          <button onClick={finish} aria-label="Skip tour" style={{ border: 0, background: 'transparent', color: '#6b6b6b', cursor: 'pointer' }}>Skip</button>
        </div>
        <p style={{ margin: '0 0 18px', color: '#555', fontSize: 14, lineHeight: 1.5 }}>{step.body}</p>
        <button onClick={next} className="btn-base btn-solid" style={{ width: '100%' }}>
          {isLast ? 'Finish tour' : 'Next'}
        </button>
      </div>
    </div>
  )
}
