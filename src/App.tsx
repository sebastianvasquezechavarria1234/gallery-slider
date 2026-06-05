import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

const SLIDES = [
  '/landing-hero.webp',
  '/landing-hero.webp',
  '/landing-hero.webp',
  '/landing-hero.webp',
]

const SLIDE_DURATION = 5000

export default function App() {
  const [current, setCurrent] = useState(0)
  const isTransitioning = useRef(false)
  const currentRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)
  const nextImgRef = useRef<HTMLImageElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const transition = useCallback((targetIndex: number) => {
    if (isTransitioning.current || targetIndex === current) return
    isTransitioning.current = true
    clearTimeout(timerRef.current)

    const curEl = currentRef.current
    const nxtEl = nextRef.current
    const nxtImg = nextImgRef.current
    if (!curEl || !nxtEl || !nxtImg) return

    nxtImg.src = SLIDES[targetIndex]

    const direction = targetIndex > current ? -1 : 1

    gsap.set(nxtEl, { x: `${-direction * 100}%` })

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

  useEffect(() => {
    timerRef.current = setTimeout(goNext, SLIDE_DURATION)
    return () => clearTimeout(timerRef.current)
  }, [current, goNext])

  return (
    <div className="slider-root">
      {/* Current slide */}
      <div ref={currentRef} className="slider-slide">
        <img src={SLIDES[current]} alt="" draggable={false} />
      </div>

      {/* Next slide */}
      <div ref={nextRef} className="slider-slide" style={{ pointerEvents: 'none' }}>
        <img ref={nextImgRef} src={SLIDES[0]} alt="" draggable={false} />
      </div>

      {/* Vignette */}
      <div className="vignette" />

      {/* Preview bar */}
      <div className="preview-bar">
        <button className="nav-arrow" onClick={goPrev} aria-label="Previous">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" fill="none" style={{ transform: 'scaleX(-1)' }}>
            <g clipPath="url(#clipPrev)">
              <path d="M31.7261 15.9148C25.2964 15.9148 20.0781 10.5769 20.0781 3.99988" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10"/>
              <path d="M31.7261 15.9149C25.2964 15.9149 20.0781 21.2528 20.0781 27.8298" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10"/>
              <path d="M32 15.9147L0 15.9147" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10"/>
            </g>
            <defs>
              <clipPath id="clipPrev">
                <rect width="32" height="32" fill="white"/>
              </clipPath>
            </defs>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" fill="none">
            <g clipPath="url(#clipNext)">
              <path d="M31.7261 15.9148C25.2964 15.9148 20.0781 10.5769 20.0781 3.99988" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10"/>
              <path d="M31.7261 15.9149C25.2964 15.9149 20.0781 21.2528 20.0781 27.8298" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10"/>
              <path d="M32 15.9147L0 15.9147" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10"/>
            </g>
            <defs>
              <clipPath id="clipNext">
                <rect width="32" height="32" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>

      {/* Credits */}
      <div className="credits">
        <a href="https://sebas-dev.vercel.app/" target="_blank" rel="noopener noreferrer" className="credit-btn">
          ✨ Created by Sebastián Vasquez
        </a>
        <a href="https://github.com/sebastianvasquezechavarria1234/gallery-slider" target="_blank" rel="noopener noreferrer" className="credit-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V5z"/>
            <path d="M2 17h20"/>
            <path d="M6 20h12"/>
          </svg>
          View source code
        </a>
      </div>
    </div>
  )
}
