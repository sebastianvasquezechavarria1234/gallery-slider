import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

const SLIDES = [
  { src: '/slider-1.webp', kenBurns: 'kb-left' },
  { src: '/slider-2.webp', kenBurns: 'kb-right' },
  { src: '/slider-3.webp', kenBurns: 'kb-up' },
  { src: '/slider-4.webp', kenBurns: 'kb-down' },
]

const SLIDE_DURATION = 5000
const TRANSITION_DURATION = 1.0
const DRAG_THRESHOLD = 60

export default function App() {
  const [current, setCurrent] = useState(0)
  const isTransitioning = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const outRef = useRef<HTMLDivElement>(null)
  const inRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const goTo = useCallback((index: number) => {
    if (isTransitioning.current || index === current) return
    isTransitioning.current = true
    clearTimeout(timerRef.current)

    const outEl = outRef.current
    const inEl = inRef.current
    const overlayEl = overlayRef.current
    if (!outEl || !inEl || !overlayEl) return

    const direction = index > current ? -1 : 1

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrent(index)
        gsap.set(outEl, { clearProps: 'all' })
        gsap.set(inEl, { clearProps: 'all' })
        gsap.set(overlayEl, { clearProps: 'all' })
        gsap.set(containerRef.current, { clearProps: 'filter' })
        isTransitioning.current = false
      },
    })

    // ── Reset positions ──
    gsap.set(inEl, {
      x: `${direction * 100}%`,
      scale: 1.05,
      filter: 'blur(12px)',
      opacity: 0.7,
    })

    gsap.set(outEl, { zIndex: 1 })
    gsap.set(inEl, { zIndex: 2 })

    // ── Phase 1: WHIP — fast exit + enter ──
    tl.to(outEl, {
      duration: TRANSITION_DURATION,
      x: `${direction * -100}%`,
      scale: 1.08,
      filter: 'blur(14px)',
      opacity: 0.3,
      ease: 'power3.in',
    })

    tl.to(
      inEl,
      {
        duration: TRANSITION_DURATION,
        x: '0%',
        filter: 'blur(0px)',
        opacity: 1,
        scale: 1,
        ease: 'power3.out',
      },
      `<0.05`
    )

    // ── Phase 2: Dark overlay sweep ──
    gsap.set(overlayEl, {
      opacity: 0,
      background: `linear-gradient(${direction > 0 ? '90deg' : '270deg'},
        transparent 0%,
        rgba(0,0,0,0.6) 50%,
        transparent 100%)`,
    })

    tl.to(overlayEl, {
      duration: TRANSITION_DURATION * 0.5,
      opacity: 1,
      ease: 'power2.in',
    }, `<0.1`)

    tl.to(overlayEl, {
      duration: TRANSITION_DURATION * 0.5,
      opacity: 0,
      ease: 'power2.out',
    })

    // ── Phase 3: Camera shake at impact ──
    const shakeTimeline = gsap.timeline()
    const shakeAmount = 4
    const shakeCount = 6

    for (let i = 0; i < shakeCount; i++) {
      const power = shakeAmount * (1 - i / shakeCount)
      shakeTimeline.to(containerRef.current, {
        duration: 0.04,
        x: (i % 2 === 0 ? power : -power),
        y: (i % 3 === 0 ? power * 0.5 : -power * 0.5),
        ease: 'none',
      })
    }
    shakeTimeline.to(containerRef.current, {
      duration: 0.04,
      x: 0,
      y: 0,
      ease: 'none',
    })

    tl.add(shakeTimeline, TRANSITION_DURATION * 0.3)
  }, [current])

  // Auto-play
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % SLIDES.length)
    }, SLIDE_DURATION)
    return () => clearTimeout(timerRef.current)
  }, [current, goTo])

  // ─── Drag ───
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
      x: `${progress * 80}%`,
      scale: 1 - Math.abs(progress) * 0.06,
      filter: `blur(${Math.abs(progress) * 10}px)`,
      opacity: 1 - Math.abs(progress) * 0.3,
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
          x: '0%',
          scale: 1,
          filter: 'blur(0px)',
          opacity: 1,
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
      ref={containerRef}
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
        style={{ pointerEvents: 'none' }}
      >
        <img
          src={SLIDES[(current + 1) % SLIDES.length].src}
          alt=""
          draggable={false}
        />
      </div>

      {/* Dark sweep overlay */}
      <div ref={overlayRef} className="sweep-overlay" />

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
