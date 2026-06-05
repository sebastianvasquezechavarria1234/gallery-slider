import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

const SLIDES = [
  { src: '/slider-1.webp', kenBurns: 'kb-left' },
  { src: '/slider-2.webp', kenBurns: 'kb-right' },
  { src: '/slider-3.webp', kenBurns: 'kb-up' },
  { src: '/slider-4.webp', kenBurns: 'kb-down' },
]

const SLIDE_DURATION = 5000
const TRANSITION_DURATION = 1.6
const DRAG_THRESHOLD = 80

export default function App() {
  const [current, setCurrent] = useState(0)
  const isTransitioning = useRef(false)
  const outRef = useRef<HTMLDivElement>(null)
  const inRef = useRef<HTMLDivElement>(null)
  const lightLeakRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const goTo = useCallback((index: number) => {
    if (isTransitioning.current || index === current) return
    isTransitioning.current = true
    clearTimeout(timerRef.current)

    const outEl = outRef.current
    const inEl = inRef.current
    const leakEl = lightLeakRef.current
    if (!outEl || !inEl || !leakEl) return

    const direction = index > current ? 1 : -1

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrent(index)
        gsap.set(outEl, { clearProps: 'all' })
        isTransitioning.current = false
      },
    })

    // Incoming: start off-screen with parallax offset
    gsap.set(inEl, {
      opacity: 0,
      scale: 1.08,
      y: direction * 30,
      filter: 'blur(8px)',
    })

    // Light leak: reset
    gsap.set(leakEl, {
      opacity: 0,
      x: direction > 0 ? '-100%' : '100%',
    })

    // ── Phase 1: Outgoing fades & blurs ──
    tl.to(outEl, {
      duration: TRANSITION_DURATION * 0.7,
      scale: 1.06,
      filter: 'blur(6px) saturate(0.3)',
      opacity: 0,
      ease: 'power2.in',
    })

    // ── Phase 2: Light leak sweeps across ──
    tl.to(
      leakEl,
      {
        duration: TRANSITION_DURATION * 0.5,
        opacity: 1,
        x: '0%',
        ease: 'power2.inOut',
      },
      `-=${TRANSITION_DURATION * 0.55}`
    )

    tl.to(leakEl, {
      duration: TRANSITION_DURATION * 0.5,
      opacity: 0,
      x: direction > 0 ? '100%' : '-100%',
      ease: 'power2.out',
    })

    // ── Phase 3: Incoming resolves ──
    tl.to(
      inEl,
      {
        duration: TRANSITION_DURATION * 0.8,
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px) saturate(1)',
        ease: 'power3.out',
      },
      `-=${TRANSITION_DURATION * 0.8}`
    )
  }, [current])

  // Auto-play
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % SLIDES.length)
    }, SLIDE_DURATION)
    return () => clearTimeout(timerRef.current)
  }, [current, goTo])

  // ─── Drag handlers ───
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isTransitioning.current) return
    dragStart.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current || isTransitioning.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y

    if (!isDragging.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
      isDragging.current = true
    }
    if (!isDragging.current) return

    const el = outRef.current
    if (!el) return

    const progress = dx / window.innerWidth
    gsap.set(el, {
      x: dx * 0.4,
      scale: 1 - Math.abs(progress) * 0.04,
      filter: `blur(${Math.abs(progress) * 6}px) saturate(${1 - Math.abs(progress) * 0.5})`,
    })
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return
      const dx = e.clientX - dragStart.current.x
      dragStart.current = null

      const el = outRef.current
      if (el && !isTransitioning.current) {
        gsap.to(el, {
          duration: 0.5,
          x: 0,
          scale: 1,
          filter: 'blur(0px) saturate(1)',
          ease: 'elastic.out(1, 0.75)',
        })
      }

      if (!isDragging.current || Math.abs(dx) < DRAG_THRESHOLD) {
        isDragging.current = false
        return
      }
      isDragging.current = false

      const next =
        dx < 0
          ? (current + 1) % SLIDES.length
          : (current - 1 + SLIDES.length) % SLIDES.length
      goTo(next)
    },
    [current, goTo]
  )

  return (
    <div
      className="slider-root"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: 'none', cursor: 'grab' }}
    >
      {/* Active slide */}
      <div
        ref={outRef}
        className={`slider-slide ${SLIDES[current].kenBurns}`}
      >
        <img src={SLIDES[current].src} alt="" draggable={false} />
      </div>

      {/* Incoming slide */}
      <div
        ref={inRef}
        className="slider-slide"
        style={{ zIndex: 10, pointerEvents: 'none' }}
      >
        <img
          src={SLIDES[(current + 1) % SLIDES.length].src}
          alt=""
          draggable={false}
        />
      </div>

      {/* Light leak overlay */}
      <div ref={lightLeakRef} className="light-leak" />

      {/* Vignette */}
      <div className="vignette" />

      {/* Dots */}
      <div className="dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
