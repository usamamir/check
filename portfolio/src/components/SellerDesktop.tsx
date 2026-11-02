import { useEffect, useMemo, useState } from 'react'
import {
  capabilities,
  desktopIcons,
  profile,
  tools,
  work,
  type WindowId,
} from '../data'
import { Window } from './Window'

type WinState = {
  id: WindowId
  title: string
  x: number
  y: number
  width?: number
  open: boolean
}

const TITLES: Record<WindowId, string> = {
  about: 'About_Uzi.txt — Notepad',
  listings: 'Active Listings — Catalog Manager',
  ppc: 'PPC Command Center',
  research: 'Research Lab — Capability Index',
  brands: 'Brand_Roster.xls — Spreadsheet',
  mail: 'Inbox — SellerOS Mail',
  update: 'System Update — SellerOS',
}

function initialWindows(): WinState[] {
  return [
    { id: 'about', title: TITLES.about, x: 120, y: 40, width: 420, open: true },
    { id: 'listings', title: TITLES.listings, x: 200, y: 70, width: 520, open: false },
    { id: 'ppc', title: TITLES.ppc, x: 160, y: 90, width: 460, open: false },
    { id: 'research', title: TITLES.research, x: 240, y: 60, width: 440, open: false },
    { id: 'brands', title: TITLES.brands, x: 180, y: 110, width: 520, open: false },
    { id: 'mail', title: TITLES.mail, x: 220, y: 80, width: 420, open: false },
    { id: 'update', title: TITLES.update, x: 260, y: 120, width: 400, open: false },
  ]
}

type Props = {
  onEnter2026: () => void
}

export function SellerDesktop({ onEnter2026 }: Props) {
  const [windows, setWindows] = useState<WinState[]>(initialWindows)
  const [zStack, setZStack] = useState<WindowId[]>(['about'])
  const [selectedIcon, setSelectedIcon] = useState<string | null>('about')
  const [startOpen, setStartOpen] = useState(false)
  const [toast, setToast] = useState(true)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
          ' · ' +
          d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      )
    }
    tick()
    const id = window.setInterval(tick, 30000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStartOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeId = zStack[zStack.length - 1]
  const openWindows = useMemo(() => windows.filter((w) => w.open), [windows])

  const focus = (id: WindowId) => {
    setZStack((prev) => [...prev.filter((x) => x !== id), id])
  }

  const openWindow = (id: WindowId) => {
    const mobile = window.innerWidth < 720
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              open: true,
              x: mobile ? 8 : Math.min(w.x, window.innerWidth - 80),
              y: mobile ? 48 : Math.min(w.y, window.innerHeight - 120),
              width: mobile ? Math.min(w.width ?? 420, window.innerWidth - 16) : w.width,
            }
          : w,
      ),
    )
    focus(id)
    setStartOpen(false)
    setSelectedIcon(id)
  }

  const closeWindow = (id: WindowId) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, open: false } : w)))
    setZStack((prev) => prev.filter((x) => x !== id))
  }

  const moveWindow = (id: WindowId, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)))
  }

  const renderBody = (id: WindowId) => {
    switch (id) {
      case 'about':
        return (
          <>
            <span className="sos-badge">SELLER PROFILE</span>
            <h2 className="sos-h1">{profile.name}</h2>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>{profile.title}</p>
            <p className="sos-muted" style={{ marginBottom: 10 }}>
              {profile.tagline}
            </p>
            {profile.about.slice(0, 2).map((p) => (
              <p key={p.slice(0, 20)} style={{ marginBottom: 8 }}>
                {p}
              </p>
            ))}
            <p style={{ marginTop: 12 }}>
              <strong>Education:</strong> {profile.education.degree}, {profile.education.school} (
              {profile.education.years})
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>Contact:</strong> {profile.email}
            </p>
          </>
        )
      case 'listings':
        return (
          <>
            <span className="sos-badge">CATALOG · LIVE SKUs</span>
            <p className="sos-muted" style={{ marginBottom: 10 }}>
              Career roles rendered as active marketplace listings.
            </p>
            {work.map((item) => (
              <div className="sos-listing-card" key={item.id}>
                <div className="sos-listing-card__top">
                  <strong>
                    {item.id}. {item.company}
                  </strong>
                  <span>BSR {item.rank}</span>
                </div>
                <div className="sos-listing-card__asin">ASIN {item.asin}</div>
                <div style={{ margin: '4px 0' }}>
                  {item.role} · {item.location} · {item.years}
                </div>
                <p className="sos-muted">{item.summary}</p>
              </div>
            ))}
          </>
        )
      case 'ppc':
        return (
          <>
            <span className="sos-badge">CAMPAIGN MONITOR</span>
            <div className="sos-kpi-row">
              {profile.stats.map((s) => (
                <div className="sos-kpi" key={s.label}>
                  <strong>{s.value}</strong>
                  <span className="sos-muted">{s.label}</span>
                </div>
              ))}
            </div>
            <p>
              PPC systems Uzi has run across Amazon ads, Google Ads, and multi-channel paid growth —
              optimized for rank, conversion, and profitable scale.
            </p>
            <ul className="sos-list">
              <li>Amazon Sponsored Products / Brands / Display</li>
              <li>Listing A/B tests tied to ad efficiency</li>
              <li>Search term harvesting & negative keyword hygiene</li>
              <li>Budget forecasting across brand portfolios</li>
            </ul>
            <div style={{ marginTop: 14 }}>
              <button type="button" className="sos-btn sos-btn--primary" onClick={() => openWindow('update')}>
                Launch 2026 growth stack →
              </button>
            </div>
          </>
        )
      case 'research':
        return (
          <>
            <span className="sos-badge">CAPABILITY INDEX</span>
            {capabilities.map((cap) => (
              <div key={cap.group} style={{ marginBottom: 12 }}>
                <strong>{cap.group}</strong>
                <ul className="sos-list">
                  {cap.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p style={{ marginTop: 8 }}>
              <strong>Tools:</strong> {tools.join(' · ')}
            </p>
          </>
        )
      case 'brands':
        return (
          <>
            <span className="sos-badge">40+ BRAND COLLABORATIONS</span>
            <table className="sos-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Brand</th>
                  <th>Role</th>
                  <th>Years</th>
                  <th>Market</th>
                </tr>
              </thead>
              <tbody>
                {work.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.company}</td>
                    <td>{item.role}</td>
                    <td>{item.years}</td>
                    <td>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="sos-muted" style={{ marginTop: 10 }}>
              Plus earlier engagements across Ghostek, Toynk (earlier term), NGSOD, Try Snow, and more.
            </p>
          </>
        )
      case 'mail':
        return (
          <>
            <span className="sos-badge">NEW MESSAGE</span>
            <div className="sos-mail-compose">
              <label>To</label>
              <input readOnly value={profile.email} />
              <label>Subject</label>
              <input defaultValue="Project inquiry — marketplace growth" />
              <label>Body</label>
              <textarea defaultValue="Hey Uzi — we need help scaling our Amazon / multi-channel catalog. Here's the brief…" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a className="sos-btn sos-btn--primary" href={`mailto:${profile.email}?subject=Project%20inquiry`}>
                  Send via email client
                </a>
                <button type="button" className="sos-btn" onClick={() => openWindow('update')}>
                  Or enter 2026 site
                </button>
              </div>
            </div>
          </>
        )
      case 'update':
        return (
          <>
            <span className="sos-badge">UPDATE AVAILABLE</span>
            <h2 className="sos-h1">SellerOS 2016 → Commerce 2026</h2>
            <p style={{ marginBottom: 10 }}>
              A modern portfolio build is ready. Keep the classic seller desktop, or enter the 2026
              experience — same operator, new interface.
            </p>
            <ul className="sos-list">
              <li>Immersive case-study layout</li>
              <li>Full capability stack</li>
              <li>One-click return to classic desktop anytime</li>
            </ul>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="sos-btn sos-btn--primary" onClick={onEnter2026}>
                Enter Commerce 2026
              </button>
              <button type="button" className="sos-btn" onClick={() => closeWindow('update')}>
                Remind me later
              </button>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="sos sos-root" onClick={() => startOpen && setStartOpen(false)}>
      <div className="sos-desktop">
        <div className="sos-watermark" aria-hidden>
          <div className="sos-watermark__title">
            SELLER
            <br />
            OS
          </div>
          <div className="sos-watermark__sub">Marketplace Workstation · Build 2016.11</div>
        </div>

        <div className="sos-icons">
          {desktopIcons.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className={`sos-icon ${selectedIcon === icon.id ? 'is-selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIcon(icon.id)
                if (icon.window) openWindow(icon.window)
              }}
            >
              <span
                className={`sos-icon__glyph ${
                  icon.icon === 'trash' ? 'is-danger' : icon.icon === 'mail' ? 'is-amber' : ''
                }`}
                aria-hidden
              >
                <i className={`glyph glyph--${icon.icon}`} />
              </span>
              <span className="sos-icon__label">{icon.label}</span>
            </button>
          ))}
        </div>

        {openWindows.map((win) => (
          <div key={win.id} style={{ zIndex: 10 + zStack.indexOf(win.id) }}>
            <Window
              id={win.id}
              title={win.title}
              active={activeId === win.id}
              x={win.x}
              y={win.y}
              width={win.width}
              status={
                win.id === 'listings'
                  ? `${work.length} listings · catalog synced`
                  : win.id === 'ppc'
                    ? 'ACoS monitor · live'
                    : 'SellerOS ready'
              }
              onFocus={(id) => focus(id as WindowId)}
              onClose={(id) => closeWindow(id as WindowId)}
              onMove={(id, x, y) => moveWindow(id as WindowId, x, y)}
            >
              {renderBody(win.id)}
            </Window>
          </div>
        ))}

        {toast && (
          <div className="sos-update-toast" onClick={(e) => e.stopPropagation()}>
            <h3>Commerce System Update</h3>
            <p>
              SellerOS detected a 2026 portfolio build. Update now for the modern Uzi Mir experience —
              or explore the classic desktop first.
            </p>
            <div className="sos-update-toast__actions">
              <button
                type="button"
                className="sos-btn sos-btn--primary"
                onClick={() => {
                  setToast(false)
                  onEnter2026()
                }}
              >
                Update to 2026
              </button>
              <button
                type="button"
                className="sos-btn"
                onClick={() => {
                  setToast(false)
                  openWindow('update')
                }}
              >
                Details…
              </button>
              <button type="button" className="sos-btn" onClick={() => setToast(false)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {startOpen && (
          <div className="sos-start-menu" onClick={(e) => e.stopPropagation()}>
            <div className="sos-start-menu__spine">SellerOS</div>
            <div className="sos-start-menu__list">
              {desktopIcons
                .filter((i) => i.window)
                .map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    className="sos-start-menu__item"
                    onClick={() => icon.window && openWindow(icon.window)}
                  >
                    <span>{icon.label}</span>
                  </button>
                ))}
              <button
                type="button"
                className="sos-start-menu__item is-accent"
                onClick={() => {
                  setStartOpen(false)
                  onEnter2026()
                }}
              >
                Enter Commerce 2026 →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sos-taskbar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sos-start" onClick={() => setStartOpen((v) => !v)}>
          <span className="sos-start__orb" aria-hidden />
          Start
        </button>
        <div className="sos-task-buttons">
          {openWindows.map((win) => (
            <button
              key={win.id}
              type="button"
              className={`sos-task-btn ${activeId === win.id ? 'is-active' : ''}`}
              onClick={() => focus(win.id)}
            >
              {win.title.split('—')[0]}
            </button>
          ))}
        </div>
        <div className="sos-tray">
          <span className="sos-tray__pulse" aria-hidden />
          <span>{clock}</span>
        </div>
      </div>
    </div>
  )
}
