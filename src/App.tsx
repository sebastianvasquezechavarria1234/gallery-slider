import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

const SLIDES = [
  { src: '/slider-1.webp', kenBurns: 'kb-left' },
  { src: '/slider-2.webp', kenBurns: 'kb-right' },
  { src: '/slider-3.webp', kenBurns: 'kb-up' },
  { src: '/slider-4.webp', kenBurns: 'kb-down' },
]

const SLIDE_DURATION = 5000
const DRAG_THRESHOLD = 60

export default function App() {
  const [current, setCurrent] = useState(0)
  const isTransitioning = useRef(false)
  const outRef = useRef<HTMLDivElement>(null)
  const inRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const goTo = useCallback((index: number) => {
    if (isTransitioning.current || index === current) return
    isTransitioning.current = true
    clearTimeout(timerRef.current)

    const outEl = outRef.current
    const inEl = inRef.current
    if (!outEl || !inEl) return

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrent(index)
        gsap.set(outEl, { clearProps: 'all' })
        isTransitioning.current = false
      },
    })

    // Reset incoming
    gsap.set(inEl, { opacity: 1, filter: 'blur(20px)' })

    // Blur transition: outgoing clears, incoming blurs in
    tl.to(outEl, {
      duration: 0.6,
      filter: 'blur(20px)',
      ease: 'power2.in',
    })

    tl.set(outEl, { filter: 'blur(20px)' }, '<')

    tl.to(inEl, {
      duration: 0.6,
      filter: 'blur(0px)',
      ease: 'power2.out',
    }, '-=0.3')
  }, [current])

  const goNext = useCallback(() => {
    goTo((current + 1) % SLIDES.length)
  }, [current, goTo])

  const goPrev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length)
  }, [current, goTo])

  // Auto-play
  useEffect(() => {
    timerRef.current = setTimeout(goNext, SLIDE_DURATION)
    return () => clearTimeout(timerRef.current)
  }, [current, goNext])

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
      x: `${progress * 40}%`,
      filter: `blur(${Math.abs(progress) * 12}px)`,
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
          ease: 'power2.out',
        })
      }

      if (!isDragging.current || Math.abs(dx) < DRAG_THRESHOLD) {
        isDragging.current = false
        return
      }
      isDragging.current = false

      dx < 0 ? goNext() : goPrev()
    },
    [goNext, goPrev]
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
        style={{ pointerEvents: 'none' }}
      >
        <img
          src={SLIDES[(current + 1) % SLIDES.length].src}
          alt=""
          draggable={false}
        />
      </div>

      {/* Vignette */}
      <div className="vignette" />

      {/* Preview bar */}
      <div className="preview-bar">
        <button className="nav-arrow" onClick={goPrev} aria-label="Previous">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="preview-cards">
          {SLIDES.map((slide, i) => (
            <button
              key={i}
              className={`preview-card ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            >
              <img src={slide.src} alt="" draggable={false} />
              <span className="preview-number">{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>

        <button className="nav-arrow" onClick={goNext} aria-label="Next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Credits */}
      <div className="credits">
        <a href="https://sebas-dev.vercel.app/" target="_blank" rel="noopener noreferrer" className="credit-btn">
          <span>⭐</span> Creado por Sebastián Vasquez
        </a>
        <a href="https://github.com/sebastianvasquezechavarria1234/gallery-slider" target="_blank" rel="noopener noreferrer" className="credit-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Ver código fuente
        </a>
      </div>
    </div>
  )
}
