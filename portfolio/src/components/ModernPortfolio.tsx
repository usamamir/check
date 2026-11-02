import { capabilities, profile, work } from '../data'

type Props = {
  onReturnClassic: () => void
}

export function ModernPortfolio({ onReturnClassic }: Props) {
  const year = new Date().getFullYear()

  return (
    <div className="m26 m26-root">
      <header className="m26-nav">
        <a className="m26-nav__logo" href="#top">
          <span className="m26-nav__mark">UM</span>
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
          <div className="m26-hero__plane" aria-hidden />
          <p className="m26-kicker">Commerce OS · {year} build</p>
          <h1 className="m26-brand">
            UZI
            <br />
            <span className="signal">MIR</span>
          </h1>
          <div className="m26-hero__row">
            <div>
              <p className="m26-title">{profile.title}</p>
              <div className="m26-actions">
                <a className="m26-btn m26-btn--primary" href="#work">
                  View selected work
                </a>
                <a className="m26-btn m26-btn--ghost" href={`mailto:${profile.email}`}>
                  Start a project
                </a>
              </div>
            </div>
            <p className="m26-copy">{profile.tagline}</p>
          </div>
        </section>

        <section className="m26-stats" aria-label="Highlights">
          <div className="m26-stats__grid">
            {profile.stats.map((stat) => (
              <div className="m26-stat" key={stat.label}>
                <div className="m26-stat__value">{stat.value}</div>
                <div className="m26-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="m26-section" id="work">
          <div className="m26-section__head">
            <p className="m26-eyebrow">Selected work</p>
            <h2 className="m26-h2">
              Brands scaled.
              <br />
              <em>Systems engineered.</em>
            </h2>
          </div>
          <div className="m26-wrap">
            {work.map((item) => (
              <article className="m26-work-item" key={item.id}>
                <div className="m26-work-item__id">{item.id}</div>
                <div>
                  <h3 className="m26-work-item__company">{item.company}</h3>
                  <p className="m26-work-item__meta">{item.location}</p>
                  <p className="m26-work-item__role">{item.role}</p>
                </div>
                <div>
                  <p className="m26-work-item__summary">{item.summary}</p>
                  <div className="m26-tags">
                    {item.focus.map((tag) => (
                      <span className="m26-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="m26-year">{item.years}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="m26-section" id="capabilities">
          <div className="m26-section__head">
            <p className="m26-eyebrow">Capabilities</p>
            <h2 className="m26-h2">
              The operating stack
              <br />
              <em>behind the growth.</em>
            </h2>
          </div>
          <div className="m26-wrap m26-cap-grid">
            {capabilities.map((cap) => (
              <div className="m26-cap" key={cap.group}>
                <h3 className="m26-cap__group">{cap.group}</h3>
                <ul>
                  {cap.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="m26-section" id="about">
          <div className="m26-section__head">
            <p className="m26-eyebrow">About</p>
            <h2 className="m26-h2">
              Built for brands that
              <br />
              <em>need to move.</em>
            </h2>
          </div>
          <div className="m26-wrap m26-about-grid">
            <div className="m26-portrait">
              <span className="m26-portrait__badge">Amazon Master</span>
              <div className="m26-portrait__mono">
                U
                <br />
                M
              </div>
            </div>
            <div className="m26-about-body">
              {profile.about.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
              <div className="m26-edu">
                <p className="m26-eyebrow">Education</p>
                <p style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 4 }}>{profile.education.degree}</p>
                <p className="m26-copy" style={{ margin: 0 }}>
                  {profile.education.school} · {profile.education.years}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="m26-section" id="contact">
          <div className="m26-wrap m26-contact">
            <p className="m26-eyebrow">Contact</p>
            <h2>
              Ready to scale
              <br />
              <em>what’s next?</em>
            </h2>
            <p>Tell me about your catalog, channel mix, and the growth you need. I’ll bring the systems.</p>
            <div className="m26-actions">
              <a className="m26-btn m26-btn--primary" href={`mailto:${profile.email}`}>
                Email Uzi
              </a>
              <a className="m26-btn m26-btn--ghost" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="m26-footer">
        <span>© {year} Uzi Mir</span>
        <span>SellerOS → Commerce 2026</span>
        <button type="button" onClick={onReturnClassic}>
          Reboot classic desktop
        </button>
      </footer>
    </div>
  )
}
