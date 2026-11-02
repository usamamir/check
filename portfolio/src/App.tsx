import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { capabilities, profile, tools, work } from './data'
import './index.css'

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [navSolid, setNavSolid] = useState(false)
  const [cursorOn, setCursorOn] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)

  useReveal()

  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 1500)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.4,
    })
    let raf = 0
    const frame = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    document.documentElement.classList.add('lenis', 'lenis-smooth')

    const onScroll = () => setNavSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      window.removeEventListener('scroll', onScroll)
      document.documentElement.classList.remove('lenis', 'lenis-smooth')
    }
  }, [])

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!fine) return

    const el = cursorRef.current
    if (!el) return

    let x = 0
    let y = 0
    let cx = 0
    let cy = 0
    let raf = 0

    const move = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
    }

    const tick = () => {
      cx += (x - cx) * 0.22
      cy += (y - cy) * 0.22
      el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      const interactive = t?.closest('a, button, .work-item')
      setCursorOn(Boolean(interactive))
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', over)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [])

  const year = new Date().getFullYear()

  return (
    <>
      <div className={`loader ${loaded ? 'is-done' : ''}`} aria-hidden={loaded}>
        <div className="loader__inner">
          <div className="loader__brand">
            UZI <span>MIR</span>
          </div>
          <p className="loader__meta">Loading commerce systems</p>
          <div className="loader__bar">
            <i />
          </div>
        </div>
      </div>

      <div ref={cursorRef} className={`cursor ${cursorOn ? 'is-active' : ''}`} aria-hidden />

      <header className={`nav ${navSolid ? 'is-solid' : ''}`}>
        <a className="nav__logo" href="#top" aria-label="Uzi Mir home">
          <span className="nav__mark">UM</span>
          <span>Uzi Mir</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          <a href="#work">Work</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#about">About</a>
        </nav>
        <a className="nav__cta" href={`mailto:${profile.email}`}>
          Let’s chat
        </a>
      </header>

      <main id="top">
        <section className="hero" aria-label="Introduction">
          <div className="hero__atmosphere" />
          <div className="hero__grid-plane" aria-hidden />
          <div className="hero__content">
            <p className="hero__kicker reveal">Portfolio · Marketplace Systems · {year}</p>
            <h1 className="hero__brand reveal reveal-delay-1">
              UZI
              <br />
              <span className="signal">MIR</span>
            </h1>
            <div className="hero__row">
              <div>
                <p className="hero__title reveal reveal-delay-2">{profile.title}</p>
                <div className="hero__actions reveal reveal-delay-3">
                  <a className="btn btn--primary" href="#work">
                    View selected work
                  </a>
                  <a className="btn btn--ghost" href={`mailto:${profile.email}`}>
                    Start a project
                  </a>
                </div>
              </div>
              <p className="hero__copy reveal reveal-delay-4">{profile.tagline}</p>
            </div>
          </div>
          <span className="hero__scroll">Scroll</span>
        </section>

        <section className="stats" aria-label="Highlights">
          <div className="stats__grid">
            {profile.stats.map((stat, i) => (
              <div className={`stat reveal reveal-delay-${(i % 4) + 1}`} key={stat.label}>
                <div className="stat__value">{stat.value}</div>
                <div className="stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="work">
          <div className="section__head">
            <div>
              <p className="eyebrow reveal">Selected work</p>
              <h2 className="section-title reveal reveal-delay-1">
                Brands scaled.
                <br />
                <em>Systems engineered.</em>
              </h2>
            </div>
            <p className="hero__copy reveal reveal-delay-2" style={{ margin: 0 }}>
              A sample of roles where listings, PPC, creative, and team systems compounded into marketplace growth.
            </p>
          </div>

          <div className="work-list">
            {work.map((item, index) => (
              <article className="work-item reveal" key={item.id} style={{ transitionDelay: `${Math.min(index, 5) * 0.05}s` }}>
                <span className="work-item__accent" style={{ background: item.accent }} aria-hidden />
                <div className="work-item__id">{item.id}</div>
                <div>
                  <h3 className="work-item__company">{item.company}</h3>
                  <p className="work-item__meta">{item.location}</p>
                  <p className="work-item__role">{item.role}</p>
                </div>
                <div>
                  <p className="work-item__summary">{item.summary}</p>
                  <div className="work-item__tags">
                    {item.focus.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="work-item__year">{item.years}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="capabilities">
          <div className="section__head">
            <div>
              <p className="eyebrow reveal">Capabilities</p>
              <h2 className="section-title reveal reveal-delay-1">
                The operating stack
                <br />
                <em>behind the growth.</em>
              </h2>
            </div>
          </div>

          <div className="cap-grid">
            {capabilities.map((cap, i) => (
              <div className={`cap reveal reveal-delay-${(i % 4) + 1}`} key={cap.group}>
                <h3 className="cap__group">{cap.group}</h3>
                <ul className="cap__list">
                  {cap.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="tools reveal">
            <span className="tools__label">Tools ·</span>
            {tools.map((tool) => (
              <span key={tool}>{tool}</span>
            ))}
          </div>
        </section>

        <section className="section about" id="about">
          <div className="section__head">
            <div>
              <p className="eyebrow reveal">About</p>
              <h2 className="section-title reveal reveal-delay-1">
                Built for brands that
                <br />
                <em>need to move.</em>
              </h2>
            </div>
          </div>

          <div className="about__grid">
            <div className="about__portrait reveal">
              <span className="about__badge">Amazon Master</span>
              <div className="about__monogram">
                U
                <br />
                M
              </div>
            </div>
            <div className="about__body">
              {profile.about.map((para, i) => (
                <p className={`reveal reveal-delay-${i + 1}`} key={para.slice(0, 24)}>
                  {para}
                </p>
              ))}
              <div className="edu reveal reveal-delay-4">
                <p className="edu__label">Education</p>
                <p className="edu__degree">{profile.education.degree}</p>
                <p className="edu__meta">
                  {profile.education.school} · {profile.education.years}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="contact__panel reveal">
            <p className="eyebrow">Contact</p>
            <h2 className="contact__title">
              Ready to scale
              <br />
              <em>what’s next?</em>
            </h2>
            <p className="contact__copy">
              Tell me about your catalog, your channel mix, and the growth you need. I’ll bring the systems.
            </p>
            <div className="contact__actions">
              <a className="btn btn--primary" href={`mailto:${profile.email}?subject=Project%20inquiry%20—%20Uzi%20Mir`}>
                Email Uzi
              </a>
              <a className="contact__email" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {year} Uzi Mir</span>
        <span>Amazon · Shopify · Multi-channel</span>
        <a href="#top">Back to top</a>
      </footer>
    </>
  )
}
