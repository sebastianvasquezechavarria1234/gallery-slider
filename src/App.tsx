import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

const SLIDES = [
  '/slider-1.webp',
  '/slider-2.webp',
  '/slider-3.webp',
  '/slider-4.webp',
]

const SLIDE_DURATION = 5000
const DRAG_THRESHOLD = 60

export default function App() {
  const [current, setCurrent] = useState(0)
  const isTransitioning = useRef(false)
  const currentRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)
  const nextImgRef = useRef<HTMLImageElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)
  const dragDirection = useRef<1 | -1>(1)

  const transition = useCallback((targetIndex: number) => {
    if (isTransitioning.current || targetIndex === current) return
    isTransitioning.current = true
    clearTimeout(timerRef.current)

    const curEl = currentRef.current
    const nxtEl = nextRef.current
    const nxtImg = nextImgRef.current
    if (!curEl || !nxtEl || !nxtImg) return

    // Set next image
    nxtImg.src = SLIDES[targetIndex]

    const direction = targetIndex > current ? -1 : 1

    // Position incoming off-screen
    gsap.set(nxtEl, { x: `${-direction * 100}%` })

    // Slide both
    gsap.to(curEl, {
      duration: 0.5,
      x: `${direction * 100}%`,
      ease: 'power3.inOut',
    })

    gsap.to(nxtEl, {
      duration: 0.5,
      x: '0%',
      ease: 'power3.inOut',
      onComplete: () => {
        curEl.querySelector('img')!.src = SLIDES[targetIndex]
        gsap.set(curEl, { x: '0%' })
        gsap.set(nxtEl, { x: `${-direction * 100}%` })
        setCurrent(targetIndex)
        isTransitioning.current = false
      },
    })
  }, [current])

  const goNext = useCallback(() => {
    transition((current + 1) % SLIDES.length)
  }, [current, transition])

  const goPrev = useCallback(() => {
    transition((current - 1 + SLIDES.length) % SLIDES.length)
  }, [current, transition])

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
      dragDirection.current = dx < 0 ? -1 : 1

      // Set the next image for drag preview
      const nxtImg = nextImgRef.current
      const nxtEl = nextRef.current
      if (nxtImg && nxtEl) {
        const targetIdx = dragDirection.current === -1
          ? (current + 1) % SLIDES.length
          : (current - 1 + SLIDES.length) % SLIDES.length
        nxtImg.src = SLIDES[targetIdx]
        gsap.set(nxtEl, { x: `${-dragDirection.current * 100}%` })
      }
    }
    if (!isDragging.current) return

    const curEl = currentRef.current
    const nxtEl = nextRef.current
    if (!curEl || !nxtEl) return

    const progress = dx / window.innerWidth

    gsap.set(curEl, { x: `${progress * 60}%` })
    gsap.set(nxtEl, { x: `${(-dragDirection.current * 100) + (progress * 60 * -dragDirection.current)}%` })
  }, [current])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return
      const dx = e.clientX - dragStart.current.x
      dragStart.current = null

      if (!isDragging.current) {
        isDragging.current = false
        return
      }
      isDragging.current = false

      const curEl = currentRef.current
      const nxtEl = nextRef.current

      if (Math.abs(dx) < DRAG_THRESHOLD) {
        // Snap back
        if (curEl) gsap.to(curEl, { duration: 0.3, x: '0%', ease: 'power2.out' })
        if (nxtEl) gsap.to(nxtEl, { duration: 0.3, x: `${-dragDirection.current * 100}%`, ease: 'power2.out' })
        return
      }

      // Commit transition
      const targetIdx = dx < 0
        ? (current + 1) % SLIDES.length
        : (current - 1 + SLIDES.length) % SLIDES.length
      transition(targetIdx)
    },
    [current, transition]
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
      {/* Current slide */}
      <div ref={currentRef} className="slider-slide">
        <img src={SLIDES[current]} alt="" draggable={false} />
        <div className="slide-gradient" />
      </div>

      {/* Next slide (for transitions + drag) */}
      <div ref={nextRef} className="slider-slide" style={{ pointerEvents: 'none' }}>
        <img ref={nextImgRef} src={SLIDES[0]} alt="" draggable={false} />
        <div className="slide-gradient" />
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
          {SLIDES.map((src, i) => (
            <button
              key={i}
              className={`preview-card ${i === current ? 'active' : ''}`}
              onClick={() => transition(i)}
              aria-label={`Slide ${i + 1}`}
            >
              <img src={src} alt="" draggable={false} />
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
