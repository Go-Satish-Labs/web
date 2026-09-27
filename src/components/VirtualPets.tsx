import { useEffect, useMemo, useState } from 'react'

type Pet = {
  id: number
  emoji: string
  x: number
  y: number
  dur: number
  delay: number
  scale: number
  flip: boolean
}

const EMOJIS = ['🐾', '🐱', '🐶', '🐰', '🦊', '🐼', '🐢', '🐸', '🐨', '🦝']

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function makePet(id: number): Pet {
  return {
    id,
    emoji: EMOJIS[id % EMOJIS.length],
    x: rand(6, 94),
    y: rand(10, 90),
    dur: rand(16, 28),
    delay: rand(0, 8),
    scale: rand(0.7, 1.25),
    flip: Math.random() > 0.5,
  }
}

export default function VirtualPets() {
  const pets = useMemo(() => Array.from({ length: 6 }, (_, i) => makePet(i)), [])
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 22000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="virtual-pets" aria-hidden="true">
      {pets.map((p) => (
        <span
          key={p.id}
          className="pet"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <span
            className="pet-body"
            style={{ transform: `scale(${p.scale})${p.flip ? ' scaleX(-1)' : ''}` }}
          >
            <span className="pet-emoji">{p.emoji}</span>
            <span className="pet-trail" />
          </span>
        </span>
      ))}
    </div>
  )
}