import { useEffect, useRef, useState } from 'react'

const faqs = [
  {
    q: 'What is Fitbod?',
    a: 'Fitbod is a personalized strength training app that delivers fully customized workouts based on your goals, fitness level, and available equipment. Whether you train at home, at the gym, or on the go, Fitbod helps you build muscle, get stronger, and train smarter by utilizing progressive overload and muscle recovery alongside our science-backed, proprietary algorithm technology, which is built into every plan.',
  },
  {
    q: 'Who is Fitbod for?',
    a: 'Fitbod is designed to support all fitness levels, with a strong following among intermediate to advanced lifters and elite powerlifters.',
  },
  {
    q: 'Is Fitbod good for beginners?',
    a: 'Yes! Fitbod removes the intimidation factor for beginners by recommending appropriate weights, reps, and sets while teaching proper form with expert demos and cues. Beginners enjoy Fitbod’s intuitive design and guided approach, taking the guesswork out of their strength training goals, making it a versatile tool for anyone looking to build strength effectively.',
  },
  {
    q: 'How is the Fitbod app different from other fitness apps?',
    a: 'Fitbod is built exclusively for resistance and strength training. Our proprietary algorithm tracks your logged workout data to dynamically personalize every workout, optimize your recovery, and apply progressive overload to maximize gains.',
  },
  {
    q: 'Can I use Fitbod at home or with no gym equipment?',
    a: 'Yes. You can fully customize your equipment settings to train with bodyweight, resistance bands, or limited gear. Fitbod adjusts your plan to match your setup; no gym required.',
  },
  {
    q: 'Does Fitbod only recommend weight training exercises?',
    a: 'Primarily, yes. Fitbod focuses on resistance-based workouts using weights or bodyweight. However, it occasionally includes cardio-like movements for conditioning, stretches for recovery, and low-impact exercises for warm ups like walking or stationary cycling, all depending on your goals and settings.',
  },
]

const pressLogos = [
  { src: '/assets/time.webp', alt: 'TIME' },
  { src: '/assets/business-insider.webp', alt: 'Business Insider' },
  { src: '/assets/womens-health.webp', alt: "Women's Health" },
  { src: '/assets/the-new-york-times.webp', alt: 'The New York Times' },
  { src: '/assets/nbc.webp', alt: 'NBC' },
  { src: '/assets/people.webp', alt: 'People' },
  { src: '/assets/huffpost.webp', alt: 'HuffPost' },
  { src: '/assets/the-independent.webp', alt: 'The Independent' },
]

const footerCols = [
  {
    title: 'Popular Workouts',
    links: [
      'Back Workouts With Cable Machines',
      'Pull Day Workouts',
      'Chest Workouts With Cable Machines',
      'Triceps Workouts With Cable Machines',
      'Pull Day Workouts With Dumbbells',
      'Biceps Workouts With Dumbbells',
      'Core Workouts With Cable Machines',
      'Legs Workouts With Cable Machines',
      'Push Day Workouts',
      'Push Day Workouts With Dumbbells',
    ],
  },
  {
    title: 'Exercise Library',
    links: [
      'Best Abductor Exercises',
      'Best TRX Exercises',
      'Best Dumbbell Exercises',
      'Best Hi-Lo Pulley Cable Exercises',
      'Best Back Exercises',
      'Best Forearm Exercises',
      'Best Trapezius Exercises',
      'Best BOSU Balance Trainer Exercises',
      'Best Mini Loop Band Exercises',
      'Best Cable Crossover Exercises',
    ],
  },
  {
    title: 'Insights',
    links: [
      'How Strong Are You?',
      'Strength Gains: Consistency vs. Intensity',
      'Average Gym-Goer Strength Data',
      'Exercise Retry Rates',
      'Why Lifters Swap Exercises',
      'When Gym Attendance Actually Drops',
      'Warning Signs of Workout Burnout',
    ],
  },
  {
    title: 'Competitors',
    links: [
      'Fitbod vs. Gravl',
      'Fitbod vs. Hevy',
      'Fitbod vs. Ladder',
      'Fitbod vs. Caliber',
    ],
  },
]

const demos = [
  { src: '/assets/ss3.jpg', label: 'Barbell Bench Press' },
  { src: '/assets/ss4.jpg', label: 'Dumbbell Incline Press' },
  { src: '/assets/ss5.jpg', label: 'Back Squat Tracking' },
  { src: '/assets/ss6.jpg', label: 'Recovery Body Map' },
]

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.15 },
    )
    el.querySelectorAll('.reveal').forEach((node) => io.observe(node))
    return () => io.disconnect()
  }, [])
  return ref
}

function QrCode() {
  // Decorative QR-style pattern for app download panel
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21
    const y = Math.floor(i / 21)
    const corner =
      (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
    const seed = (x * 17 + y * 31 + x * y) % 7
    return corner || seed === 0 || seed === 3
  })
  return (
    <svg viewBox="0 0 210 210" role="img" aria-label="Scan to get the Fitbod app">
      <rect width="210" height="210" fill="#fff" />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % 21) * 10}
            y={Math.floor(i / 21) * 10}
            width="10"
            height="10"
            fill="#111"
          />
        ) : null,
      )}
      {[
        [10, 10],
        [140, 10],
        [10, 140],
      ].map(([x, y], idx) => (
        <g key={idx}>
          <rect x={x} y={y} width="60" height="60" fill="#fff" stroke="#111" strokeWidth="8" />
          <rect x={x + 16} y={y + 16} width="28" height="28" fill="#111" />
        </g>
      ))}
    </svg>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [playVideo, setPlayVideo] = useState(false)
  const pageRef = useReveal()

  return (
    <div ref={pageRef}>
      <header className="site-header">
        <div className="container nav">
          <a className="logo" href="#top" aria-label="Fitbod home">
            FITBOD
          </a>
          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
          </button>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Primary">
            <a className="has-caret" href="#articles">
              Articles
            </a>
            <a href="#workouts">Workouts</a>
            <a href="#exercises">Exercises</a>
            <a href="#help">Help</a>
            <a href="#login">Log In</a>
            <button type="button" className="has-caret">
              More
            </button>
            <a className="btn-primary nav-cta" href="#start">
              Try Fitbod
            </a>
          </nav>
        </div>
        <div className="hsa-banner">
          <span className="pill">NEW</span>
          <span>Fitbod is now covered by HSA | FSA</span>
          <a href="#eligibility">Check Eligibility</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="reveal">
              <div className="editors-choice">
                <div className="badge">
                  <img src="/assets/apple-icon.svg" alt="" />
                  <span>Editor&apos;s Choice</span>
                </div>
                <div className="reviews">250,000+ Reviews</div>
              </div>
              <h1>
                <span>Less planning.</span>
                <span>More progress.</span>
              </h1>
              <p className="hero-copy">
                Fitbod creates a personalized workout plan that updates with your body,
                recovery, and progress. Know exactly what to do next—without second guessing
                what&apos;s best for you.
              </p>
              <p className="hero-platforms">Available on both Android and iOS.</p>
              <a className="btn-primary lg" href="#start">
                Start Now
              </a>
            </div>
            <div className="hero-visual reveal">
              <img
                className="hero-phones"
                src="/assets/01-Hero-Mockup_v4.png"
                alt="Fitbod app showing target muscles and workout exercise list"
              />
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="container stats-row reveal">
            <div className="stat">
              <div className="stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <img key={i} src="/assets/pink-star.svg" alt="" />
                ))}
              </div>
              <div className="value">4.8</div>
              <div className="label">Rating</div>
            </div>
            <div className="stat">
              <div className="value">15M+</div>
              <div className="label">Downloads</div>
            </div>
            <div className="stat">
              <div className="value">120M+</div>
              <div className="label">Workouts logged</div>
            </div>
          </div>
        </section>

        <section className="features" id="workouts">
          <div className="container">
            <article className="feature">
              <div className="feature-copy reveal">
                <div className="section-label">
                  <img src="/assets/icon-checked.svg" alt="" />
                  Personalized Workouts
                </div>
                <h2>A plan made for you and your goals</h2>
                <p>
                  Fitbod removes the planning work behind strength training by creating a
                  personalized routine that updates as you go—so you can focus on lifting, not
                  figuring everything out.
                </p>
              </div>
              <div className="feature-media glow reveal">
                <img
                  src="/assets/how-fitbod-works-hero.png"
                  alt="Fitbod logging a Back Squat set with estimated strength chart"
                />
              </div>
            </article>

            <article className="feature reverse">
              <div className="feature-copy reveal">
                <div className="section-label">
                  <img src="/assets/icon-checked.svg" alt="" />
                  Smart Tracking
                </div>
                <h2>See your progress as it happens</h2>
                <p>
                  Fitbod tracks your performance over time and updates your recommendations as
                  you improve—so you always know you&apos;re moving forward.
                </p>
              </div>
              <div className="feature-media glow reveal">
                <img
                  src="/assets/Smart-tracking-hero.png"
                  alt="Athlete with Fitbod progress overlays showing strength gains"
                />
              </div>
            </article>

            <article className="feature">
              <div className="feature-copy reveal">
                <div className="section-label">
                  <img src="/assets/icon-checked.svg" alt="" />
                  Custom-Fit Workouts
                </div>
                <h2>Built around your real life</h2>
                <p>
                  Fitbod creates workouts based on your equipment, schedule, and
                  preferences—so you can keep making progress without forcing your life to fit
                  a rigid plan.
                </p>
              </div>
              <div className="feature-media glow reveal">
                <img
                  src="/assets/hyper-personalized-hero.png"
                  alt="Fitbod equipment preferences and exercise how-to preview"
                />
              </div>
            </article>

            <article className="feature reverse">
              <div className="feature-copy reveal">
                <div className="section-label">
                  <img src="/assets/icon-checked.svg" alt="" />
                  Monitored Recovery
                </div>
                <h2>Know what to train next</h2>
                <p>
                  Fitbod uses your training history and recovery to recommend the right muscles
                  for each session—so you can stop guessing and train with confidence.
                </p>
              </div>
              <div className="feature-media glow reveal">
                <img
                  src="/assets/Recovery-hero.png"
                  alt="Athlete with muscle recovery percentages for triceps and biceps"
                />
              </div>
            </article>
          </div>
        </section>

        <section className="video-section" id="video">
          <div className="container">
            <div className="section-head reveal">
              <div className="section-label" style={{ justifyContent: 'center' }}>
                Watch Fitbod
              </div>
              <h2>Welcome to Fitbod. Start your strength journey today.</h2>
            </div>
            <div className="video-frame reveal">
              {playVideo ? (
                <iframe
                  title="Fitbod promotional video"
                  src="https://www.youtube.com/embed/X4OP4REgJAE?autoplay=1&rel=0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className="video-poster"
                  onClick={() => setPlayVideo(true)}
                  aria-label="Play Fitbod video"
                >
                  <img src="/assets/promo-yt.jpg" alt="Fitbod promo video thumbnail" />
                  <div className="play">
                    <span>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5v14l11-7L8 5z" fill="#fff" />
                      </svg>
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="exercise-demos" id="exercises">
              {demos.map((d) => (
                <article key={d.label} className="demo-card reveal">
                  <img src={d.src} alt={d.label} />
                  <div className="caption">{d.label}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="featured">
          <div className="container reveal">
            <div className="section-label" style={{ justifyContent: 'center' }}>
              Featured In
            </div>
            <div className="logo-row">
              {pressLogos.map((logo) => (
                <img key={logo.alt} src={logo.src} alt={logo.alt} />
              ))}
            </div>
          </div>
        </section>

        <section className="faq" id="help">
          <div className="container">
            <h2 className="reveal">FAQ</h2>
            <div className="faq-list reveal">
              {faqs.map((item, i) => {
                const open = openFaq === i
                return (
                  <div key={item.q} className={`faq-item ${open ? 'open' : ''}`}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      {item.q}
                      <span className="icon" aria-hidden="true">
                        +
                      </span>
                    </button>
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <a className="faq-more" href="#faqs">
              View all FAQs
            </a>
          </div>
        </section>

        <section className="final-cta" id="start">
          <div className="container final-cta-inner">
            <div className="reveal">
              <p className="eyebrow">Got a moment?</p>
              <h2>Let&apos;s build your personalized workout plan.</h2>
              <a className="btn-primary lg" href="https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543">
                Start Now
              </a>
            </div>
            <div className="qr-panel reveal">
              <QrCode />
              <p>Scan the QR code with your phone to get the app</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-cols">
            {footerCols.map((col) => (
              <div key={col.title}>
                <h3>{col.title}</h3>
                {col.links.map((link) => (
                  <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}>
                    {link}
                  </a>
                ))}
                {col.title !== 'Competitors' && (
                  <a className="more" href="#more">
                    Show More
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="footer-bottom">
            <a className="logo" href="#top">
              FITBOD
            </a>
            <div className="footer-links">
              <a href="#about">About</a>
              <a href="#faqs">FAQs</a>
              <a href="#help">Help</a>
              <a href="#contact">Contact</a>
              <a href="#billing">Account &amp; Billing</a>
              <a href="#business">For Business</a>
              <a href="#families">For Families</a>
            </div>
            <div className="store-badges">
              <a
                href="https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.03-.8.88-2.13 1.56-3.27 1.47-.14-1.1.43-2.26 1.17-3.07.8-.9 2.2-1.56 3.28-1.43zM20.5 17.2c-.58 1.33-1.28 2.55-2.22 3.67-.95 1.14-1.95 2.16-3.35 2.18-1.05.02-1.74-.55-3.24-.55-1.5 0-2.25.53-3.36.57-1.37.05-2.42-1.22-3.38-2.35C3.1 18.5 1.7 14.76 3.3 12.16c.9-1.46 2.5-2.39 4.24-2.42 1.32-.03 2.57.89 3.24.89.66 0 2.17-1.1 3.66-.94.62.03 2.37.25 3.49 1.9-.09.06-2.08 1.21-2.06 3.62.03 2.87 2.52 3.82 2.55 3.83l.08-.04z" />
                </svg>
                <div>
                  <div className="tiny">Download on the</div>
                  <div className="store-name">App Store</div>
                </div>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.fitbod.fitbod"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#34A853" d="M3 20.5V3.5L14 12 3 20.5z" />
                  <path fill="#4285F4" d="M14 12l2.8-2.1 4.5 2.6-4.5 2.6L14 12z" />
                  <path fill="#FBBC04" d="M3 20.5L14 12l2.8 2.1L5.7 22l-2.7-1.5z" />
                  <path fill="#EA4335" d="M3 3.5L5.7 2l11.1 7.9L14 12 3 3.5z" />
                </svg>
                <div>
                  <div className="tiny">Get it on</div>
                  <div className="store-name">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          <div className="legal">
            <span>© 2025 Fitbod, Inc</span>
            <a href="#terms">Terms &amp; Conditions</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#ccpa">CCPA – Privacy Policy</a>
          </div>
          <p className="demo-note">
            Unofficial visual clone for demo purposes. Fitbod® and related marks belong to
            Fitbod, Inc. Original site: fitbod.me
          </p>
        </div>
      </footer>
    </div>
  )
}
