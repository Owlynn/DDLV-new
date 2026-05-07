'use client'

import { useEffect, useState, useCallback } from 'react'

const IMAGES = [
  '/assets/atelier (1).jpeg',
  '/assets/atelier (1).jpg',
  '/assets/atelier (2).jpeg',
  '/assets/atelier (2).jpg',
  '/assets/atelier (3).jpg',
  '/assets/atelier (4).jpg',
  '/assets/atelier (5).jpg',
  '/assets/atelier (6).jpg',
  '/assets/atelier (7).jpg',
  '/assets/atelier (8).jpg',
  '/assets/atelier (9).jpg',
  '/assets/atelierfocus.png',
]

const DRIFTS = ['photo-bubble-float-1', 'photo-bubble-float-2', 'photo-bubble-float-3']

// Reference viewport for overlap calculations (desktop baseline)
const REF_W = 1440
const REF_H = 900

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

type BubblePos = { x: number; y: number; size: number }

function overlaps(a: BubblePos, b: BubblePos): boolean {
  const dx = (a.x - b.x) / 100 * REF_W
  const dy = (a.y - b.y) / 100 * REF_H
  const dist = Math.sqrt(dx * dx + dy * dy)
  return dist < (a.size + b.size) / 2 + 24
}

let uid = 0

function makeBubble(usedImages: string[] = [], existing: BubblePos[] = []) {
  const available = IMAGES.filter(img => !usedImages.includes(img))
  const pool = available.length > 0 ? available : IMAGES

  let x = rand(5, 88), y = rand(5, 85), size = rand(80, 200)
  for (let attempt = 0; attempt < 25; attempt++) {
    if (!existing.some(e => overlaps({ x, y, size }, e))) break
    x = rand(5, 88)
    y = rand(5, 85)
    size = rand(80, 200)
  }

  return {
    id: uid++,
    src: pool[Math.floor(Math.random() * pool.length)],
    x,
    y,
    size,
    lifetime: rand(6000, 20000),
    drift: DRIFTS[Math.floor(Math.random() * DRIFTS.length)],
    driftDuration: rand(28000, 52000),
    driftOffset: rand(0, 30000),
  }
}

type Bubble = ReturnType<typeof makeBubble> & { enterDelay: number }

function PhotoBubble({
  id, src, x, y, size, lifetime, drift, driftDuration, driftOffset, enterDelay, onDone,
}: Bubble & { onDone: (id: number) => void }) {
  const [popping, setPopping] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPopping(true), lifetime + enterDelay)
    return () => clearTimeout(t)
  }, [lifetime, enterDelay])

  useEffect(() => {
    if (!popping) return
    const t = setTimeout(() => onDone(id), 500)
    return () => clearTimeout(t)
  }, [popping, id, onDone])

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationName: popping ? 'photo-bubble-pop' : 'photo-bubble-enter',
        animationDuration: popping ? '0.45s' : '1s',
        animationTimingFunction: popping ? 'ease-out' : 'cubic-bezier(0.34,1.56,0.64,1)',
        animationFillMode: popping ? 'forwards' : 'both',
        animationDelay: popping ? '0s' : `${enterDelay}ms`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          animationName: drift,
          animationDuration: `${driftDuration}ms`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: `-${driftOffset}ms`,
        }}
      >
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    </div>
  )
}

export default function PhotoBubblesLayer() {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    const result: Bubble[] = []
    for (let i = 0; i < 5; i++) {
      const usedImages = result.map(b => b.src)
      const existing = result.map(b => ({ x: b.x, y: b.y, size: b.size }))
      result.push({ ...makeBubble(usedImages, existing), enterDelay: i * 700 })
    }
    return result
  })

  const onDone = useCallback((id: number) => {
    setBubbles(prev => {
      const remaining = prev.filter(b => b.id !== id)
      const usedImages = remaining.map(b => b.src)
      const existing = remaining.map(b => ({ x: b.x, y: b.y, size: b.size }))
      return prev.map(b => b.id === id ? { ...makeBubble(usedImages, existing), enterDelay: 0 } : b)
    })
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {bubbles.map(b => (
        <PhotoBubble key={b.id} {...b} onDone={onDone} />
      ))}
    </div>
  )
}
