import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const features = [
  {
    label: 'Adaptive sessions',
    title: 'A plan that moves with your week',
    body: 'Repwise builds today’s session from your goal, available gear, and training split—so you stop guessing what to train.',
  },
  {
    label: 'Form library',
    title: 'Every lift comes with a demo',
    body: 'Open any exercise to watch a YouTube technique video and review short cues before you load the bar.',
  },
  {
    label: 'Simple logging',
    title: 'Track sets without the clutter',
    body: 'Log reps and weight as you go. Finish a session and find it again in history when you want to beat last time.',
  },
]

export function Landing() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 },
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <div ref={root} className="marketing">
      <header className="m-nav">
        <Link to="/" className="brand">
          REPWISE
        </Link>
        <nav>
          <a href="#features">Features</a>
          <a href="#library">Library</a>
          <Link to="/login">Log in</Link>
          <Link className="btn primary sm" to="/signup">
            Start free
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy reveal">
          <p className="eyebrow">Strength training, simplified</p>
          <h1>
            Less guessing.
            <span>More productive training.</span>
          </h1>
          <p className="lede">
            Repwise is your personal strength coach in the browser—login, get today’s workout,
            watch form demos, and log every set.
          </p>
          <div className="hero-actions">
            <Link className="btn primary lg" to="/signup">
              Create account
            </Link>
            <Link className="btn ghost lg" to="/login">
              I already have one
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>30+</strong>
              <span>Exercise demos</span>
            </div>
            <div>
              <strong>Local</strong>
              <span>Private login</span>
            </div>
            <div>
              <strong>Desktop</strong>
              <span>Windows app</span>
            </div>
          </div>
        </div>
        <div className="hero-panel reveal" aria-hidden="true">
          <div className="phone">
            <div className="phone-top">Today’s session</div>
            <div className="phone-title">Push · Chest + Shoulders</div>
            <ul>
              <li>
                <span>Bench Press</span>
                <em>4 × 5–8</em>
              </li>
              <li>
                <span>Incline DB Press</span>
                <em>3 × 8–12</em>
              </li>
              <li>
                <span>Overhead Press</span>
                <em>3 × 5–8</em>
              </li>
              <li>
                <span>Lateral Raise</span>
                <em>3 × 12–15</em>
              </li>
            </ul>
            <div className="phone-cta">Start workout</div>
          </div>
        </div>
      </section>

      <section id="features" className="feature-band">
        {features.map((f, i) => (
          <article key={f.label} className={`feature-row reveal ${i % 2 ? 'flip' : ''}`}>
            <div>
              <p className="eyebrow">{f.label}</p>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </div>
            <div className={`feature-card tone-${i + 1}`}>
              <span>{f.label}</span>
            </div>
          </article>
        ))}
      </section>

      <section id="library" className="cta-band reveal">
        <p className="eyebrow">Ready when you are</p>
        <h2>Build your next session in under a minute.</h2>
        <Link className="btn primary lg" to="/signup">
          Get started
        </Link>
      </section>

      <footer className="m-footer">
        <span className="brand">REPWISE</span>
        <span>Original workout app · Not affiliated with Fitbod or any other brand</span>
      </footer>
    </div>
  )
}
