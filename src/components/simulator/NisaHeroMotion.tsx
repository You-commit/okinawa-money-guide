import type { CSSProperties } from 'react'

const ACCUMULATION_BARS = [
  { height: 34, principal: 78 },
  { height: 42, principal: 76 },
  { height: 39, principal: 80 },
  { height: 51, principal: 74 },
  { height: 48, principal: 76 },
  { height: 59, principal: 72 },
  { height: 55, principal: 75 },
  { height: 67, principal: 70 },
  { height: 63, principal: 72 },
  { height: 74, principal: 68 },
  { height: 70, principal: 71 },
  { height: 82, principal: 66 },
  { height: 78, principal: 69 },
  { height: 88, principal: 64 },
] as const

const PARTICLES = [
  { x: 10, y: 75, delay: 0 },
  { x: 24, y: 54, delay: -3.4 },
  { x: 42, y: 69, delay: -6.7 },
  { x: 57, y: 40, delay: -1.8 },
  { x: 73, y: 55, delay: -8.2 },
  { x: 88, y: 30, delay: -4.9 },
] as const

type MotionStyle = CSSProperties & Record<`--${string}`, string>

function NisaHeroMotion() {
  return (
    <div className="nisa-hero-motion" aria-hidden="true">
      <span className="nisa-hero-motion__flow nisa-hero-motion__flow--one" />
      <span className="nisa-hero-motion__flow nisa-hero-motion__flow--two" />
      <span className="nisa-hero-motion__flow nisa-hero-motion__flow--three" />

      <div className="nisa-hero-motion__bars">
        {ACCUMULATION_BARS.map((bar, index) => (
          <span
            className="nisa-hero-motion__bar"
            key={`${bar.height}-${index}`}
            style={{
              '--bar-height': `${bar.height}%`,
              '--bar-principal': `${bar.principal}%`,
              '--bar-delay': `${index * 240}ms`,
            } as MotionStyle}
          />
        ))}
      </div>

      <svg
        className="nisa-hero-motion__curve"
        viewBox="0 0 640 160"
        preserveAspectRatio="none"
      >
        <path
          className="nisa-hero-motion__curve-guide"
          d="M10 127 C68 124 88 116 132 118 C184 121 205 101 250 104 C300 107 325 82 372 86 C419 90 451 65 497 70 C547 75 574 45 630 50"
        />
        <path
          className="nisa-hero-motion__curve-line"
          d="M10 127 C68 124 88 116 132 118 C184 121 205 101 250 104 C300 107 325 82 372 86 C419 90 451 65 497 70 C547 75 574 45 630 50"
        />
        <path
          className="nisa-hero-motion__curve-highlight"
          d="M10 127 C68 124 88 116 132 118 C184 121 205 101 250 104 C300 107 325 82 372 86 C419 90 451 65 497 70 C547 75 574 45 630 50"
        />
      </svg>

      <div className="nisa-hero-motion__particles">
        {PARTICLES.map((particle, index) => (
          <span
            key={`${particle.x}-${particle.y}`}
            style={{
              '--particle-x': `${particle.x}%`,
              '--particle-y': `${particle.y}%`,
              '--particle-delay': `${particle.delay}s`,
              '--particle-shift': `${22 + index * 3}px`,
            } as MotionStyle}
          />
        ))}
      </div>
    </div>
  )
}

export default NisaHeroMotion
