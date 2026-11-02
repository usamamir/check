import { useEffect } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import Lenis from 'lenis'
import { capabilities, profile, tools, work } from '../data'
import { CountUp } from './CountUp'

type Props = {
  onReturnClassic: () => void
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const lineReveal: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
}

function Marquee() {
  const items = [
    profile.current.company,
    ...work.slice(1, 5).map((w) => w.company),
    ...tools.slice(0, 6),
    'Amazon PPC',
    'A+ Content',
    'Buy Box',
  ]
  const loop = [...items, ...items]

  return (
    <div className="m26-marquee" aria-hidden>
      <div className="m26-marquee__track">
        {loop.map((item, i) => (
          <span key={`${item}-${i}`}>
            {item}
            <i />
          </span>
        ))}
      </div>
    </div>
  )
}

export function ModernPortfolio({ onReturnClassic }: Props) {
  const year = new Date().getFullYear()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 })
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 120])
  const planeOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.15])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.35,
    })
    let raf = 0
    const frame = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    document.documentElement.classList.add('lenis', 'lenis-smooth')
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      document.documentElement.classList.remove('lenis', 'lenis-smooth')
    }
  }, [])

  return (
    <div className="m26 m26-root">
      <motion.div className="m26-progress" style={{ scaleX: progress }} aria-hidden />

      <header className="m26-nav">
        <a className="m26-nav__logo" href="#top">
          <motion.span
            className="m26-nav__mark"
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            UM
          </motion.span>
          <span>Uzi Mir</span>
        </a>
        <nav className="m26-nav__links" aria-label="Primary">
          <a href="#work">Work</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <button type="button" className="m26-nav__classic" onClick={onReturnClassic}>
          ← SellerOS 2016
        </button>
      </header>

      <main id="top">
        <section className="m26-hero">
          <motion.div className="m26-hero__plane" style={{ opacity: planeOpacity }} aria-hidden />
          <div className="m26-hero__orbs" aria-hidden>
            <span />
            <span />
            <span />
          </div>

          <motion.div style={{ y: heroY }}>
            <motion.p
              className="m26-kicker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Commerce OS · {year} · Now leading {profile.current.company}
            </motion.p>

            <h1 className="m26-brand">
              <motion.span
                className="m26-brand__line"
                initial={{ y: '110%', rotate: 4, opacity: 0 }}
                animate={{ y: '0%', rotate: 0, opacity: 1 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              >
                UZI
              </motion.span>
              <motion.span
                className="m26-brand__line signal"
                initial={{ y: '110%', rotate: -3, opacity: 0 }}
                animate={{ y: '0%', rotate: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                MIR
              </motion.span>
            </h1>

            <motion.div
              className="m26-hero__row"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={fadeUp}>
                <p className="m26-title">{profile.title}</p>
                <div className="m26-actions">
                  <motion.a
                    className="m26-btn m26-btn--primary"
                    href="#work"
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View selected work
                  </motion.a>
                  <motion.a
                    className="m26-btn m26-btn--ghost"
                    href={`mailto:${profile.email}`}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start a project
                  </motion.a>
                </div>
              </motion.div>
              <motion.p className="m26-copy" variants={fadeUp}>
                {profile.tagline}
              </motion.p>
            </motion.div>
          </motion.div>

          <motion.div
            className="m26-hero__chips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
          >
            <span className="m26-chip m26-chip--live">
              <i /> Live · {profile.current.company}
            </span>
            <span className="m26-chip">{profile.current.role}</span>
            <span className="m26-chip">{profile.current.tenure}</span>
          </motion.div>
        </section>

        <Marquee />

        <section className="m26-stats" aria-label="Highlights">
          <motion.div
            className="m26-stats__grid"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
          >
            {profile.stats.map((stat) => (
              <motion.div className="m26-stat" variants={fadeUp} key={stat.label}>
                <div className="m26-stat__value">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="m26-stat__label">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="m26-section" id="work">
          <motion.div
            className="m26-section__head"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger}
          >
            <motion.p className="m26-eyebrow" variants={fadeUp}>
              Selected work
            </motion.p>
            <motion.h2 className="m26-h2" variants={fadeUp}>
              Brands scaled.
              <br />
              <em>Systems engineered.</em>
            </motion.h2>
          </motion.div>

          <div className="m26-wrap">
            {work.map((item, index) => (
              <motion.article
                className={`m26-work-item ${item.current ? 'is-current' : ''}`}
                key={item.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                variants={stagger}
                whileHover={{ backgroundColor: 'rgba(244,239,230,0.03)' }}
              >
                <motion.div className="m26-work-item__id" variants={lineReveal}>
                  {item.id}
                </motion.div>
                <motion.div variants={fadeUp}>
                  <h3 className="m26-work-item__company">
                    {item.company}
                    {item.current && <span className="m26-live-pill">Current</span>}
                  </h3>
                  <p className="m26-work-item__meta">{item.location}</p>
                  <p className="m26-work-item__role">{item.role}</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p className="m26-work-item__summary">{item.summary}</p>
                  <div className="m26-tags">
                    {item.focus.map((tag) => (
                      <span className="m26-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
                <motion.div
                  className="m26-year"
                  variants={fadeUp}
                  transition={{ delay: index * 0.02 }}
                >
                  {item.years}
                </motion.div>
                <motion.span
                  className="m26-work-item__bar"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.article>
            ))}
          </div>
        </section>

        <section className="m26-section" id="capabilities">
          <motion.div
            className="m26-section__head"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p className="m26-eyebrow" variants={fadeUp}>
              Capabilities
            </motion.p>
            <motion.h2 className="m26-h2" variants={fadeUp}>
              The operating stack
              <br />
              <em>behind the growth.</em>
            </motion.h2>
          </motion.div>

          <motion.div
            className="m26-wrap m26-cap-grid"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {capabilities.map((cap, i) => (
              <motion.div
                className="m26-cap"
                key={cap.group}
                variants={fadeUp}
                whileHover={{ y: -6, borderColor: 'rgba(240,160,75,0.35)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ borderTop: i === 0 ? undefined : undefined }}
              >
                <h3 className="m26-cap__group">{cap.group}</h3>
                <ul>
                  {cap.items.map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 * idx, duration: 0.4 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="m26-wrap m26-tools-row"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="m26-tools-label">Tools</span>
            {tools.map((tool) => (
              <motion.span
                key={tool}
                className="m26-tool"
                whileHover={{ color: 'var(--signal)', y: -2 }}
              >
                {tool}
              </motion.span>
            ))}
          </motion.div>
        </section>

        <section className="m26-section" id="about">
          <motion.div
            className="m26-section__head"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p className="m26-eyebrow" variants={fadeUp}>
              About
            </motion.p>
            <motion.h2 className="m26-h2" variants={fadeUp}>
              Built for brands that
              <br />
              <em>need to move.</em>
            </motion.h2>
          </motion.div>

          <div className="m26-wrap m26-about-grid">
            <motion.div
              className="m26-portrait"
              initial={{ opacity: 0, scale: 0.92, rotate: -1.5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="m26-portrait__badge">Head of Marketing</span>
              <motion.div
                className="m26-portrait__mono"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                U
                <br />
                M
              </motion.div>
              <div className="m26-portrait__scan" aria-hidden />
            </motion.div>

            <motion.div
              className="m26-about-body"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {profile.about.map((para) => (
                <motion.p variants={fadeUp} key={para.slice(0, 24)}>
                  {para}
                </motion.p>
              ))}
              <motion.div className="m26-edu" variants={fadeUp}>
                <p className="m26-eyebrow">Education</p>
                <p style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 4 }}>
                  {profile.education.degree}
                </p>
                <p className="m26-copy" style={{ margin: 0 }}>
                  {profile.education.school} · {profile.education.years}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="m26-section" id="contact">
          <motion.div
            className="m26-wrap m26-contact"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="m26-contact__glow" aria-hidden />
            <p className="m26-eyebrow">Contact</p>
            <h2>
              Ready to scale
              <br />
              <em>what’s next?</em>
            </h2>
            <p>
              Hiring a marketing leader, or need marketplace systems that convert? Let’s talk —
              Jettribe-tested, Amazon-hardened.
            </p>
            <div className="m26-actions">
              <motion.a
                className="m26-btn m26-btn--primary"
                href={`mailto:${profile.email}`}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Email Uzi
              </motion.a>
              <motion.a
                className="m26-btn m26-btn--ghost"
                href={profile.current.url}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -3 }}
              >
                Visit Jettribe
              </motion.a>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="m26-footer">
        <span>© {year} Uzi Mir</span>
        <span>Jettribe · SellerOS → Commerce 2026</span>
        <button type="button" onClick={onReturnClassic}>
          Reboot classic desktop
        </button>
      </footer>
    </div>
  )
}
