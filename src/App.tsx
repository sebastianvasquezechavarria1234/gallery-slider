import { useState, useEffect, useCallback } from 'react'

const SLIDES = [
  { src: '/slider-1.webp', kenBurns: 'kb-left' },
  { src: '/slider-2.webp', kenBurns: 'kb-right' },
  { src: '/slider-3.webp', kenBurns: 'kb-up' },
  { src: '/slider-4.webp', kenBurns: 'kb-down' },
]

const INTERVAL = 5000

export default function App() {
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goTo = useCallback((index: number) => {
    if (isTransitioning || index === current) return
    setNext(index)
    setIsTransitioning(true)

    setTimeout(() => {
      setCurrent(index)
      setNext(null)
      setIsTransitioning(false)
    }, 1200)
  }, [current, isTransitioning])

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % SLIDES.length)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [current, goTo])

  return (
    <div className="slider-root">
      {/* Current slide */}
      <div className={`slider-slide ${SLIDES[current].kenBurns} active`}>
        <img src={SLIDES[current].src} alt="" draggable={false} />
      </div>

      {/* Next slide (overlay during transition) */}
      {next !== null && (
        <div className={`slider-slide ${SLIDES[next].kenBurns} entering`}>
          <img src={SLIDES[next].src} alt="" draggable={false} />
        </div>
      )}

      {/* Vignette overlay */}
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
