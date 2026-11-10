import { Suspense, lazy, useEffect, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ModernPortfolio } from './components/ModernPortfolio'
import { SellerDesktop } from './components/SellerDesktop'
import './index.css'
import './styles/desktop.css'
import './styles/modern.css'

const TransformScene = lazy(() =>
  import('./components/TransformScene')
    .then((m) => ({ default: m.TransformScene }))
    .catch(() => ({
      default: function TransformFallback() {
        return <div className="sos-transform__vortex" aria-hidden />
      },
    })),
)

type Phase = 'boot' | 'desktop' | 'transform' | 'modern'

const BOOT_LINES = [
  'SellerOS BIOS v4.11',
  'Checking marketplace adapters………… OK',
  'Mounting catalog volume /brands………… OK',
  'Loading Jettribe marketing profile…… OK',
  'Loading PPC kernel modules………… OK',
  'Restoring session: Uzi Mir · Head of Marketing',
  'Desktop environment ready.',
]

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot')
  const [bootCount, setBootCount] = useState(0)

  useEffect(() => {
    if (phase !== 'boot') return
    if (bootCount < BOOT_LINES.length) {
      const t = window.setTimeout(() => setBootCount((c) => c + 1), 220)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setPhase('desktop'), 700)
    return () => window.clearTimeout(t)
  }, [phase, bootCount])

  useEffect(() => {
    if (phase !== 'transform') return
    // Always advance to modern — never depend on 3D chunk success
    const t = window.setTimeout(() => setPhase('modern'), 2400)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    document.body.dataset.phase = phase
    // Ensure modern mode can scroll even if prior phase locked overflow
    if (phase === 'modern') {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = 'auto'
    } else if (phase === 'desktop' || phase === 'boot' || phase === 'transform') {
      document.body.style.overflow = 'hidden'
    }
  }, [phase])

  const enter2026 = () => setPhase('transform')
  const returnClassic = () => setPhase('desktop')

  if (phase === 'boot') {
    return (
      <div className="sos sos-boot" aria-label="SellerOS booting">
        <div className="sos-boot__logo">
          <div className="sos-boot__mark">
            SELLER<span>OS</span>
          </div>
          <div className="sos-boot__sub">Marketplace workstation</div>
        </div>
        {BOOT_LINES.slice(0, bootCount).map((line, i) => (
          <div key={line} className="sos-boot__line" style={{ animationDelay: `${i * 0.05}s` }}>
            {`> ${line}`}
          </div>
        ))}
        <div className="sos-boot__bar">
          <i />
        </div>
      </div>
    )
  }

  if (phase === 'transform') {
    return (
      <div className="sos-transform" aria-live="polite">
        <div className="sos-transform__vortex" aria-hidden />
        <ErrorBoundary fallback={<div className="sos-transform__vortex" aria-hidden />}>
          <Suspense fallback={null}>
            <TransformScene />
          </Suspense>
        </ErrorBoundary>
        <div className="sos-transform__copywrap">
          <div className="sos-transform__year">2026</div>
          <p className="sos-transform__copy">Entering the commerce vortex…</p>
        </div>
      </div>
    )
  }

  if (phase === 'modern') {
    return (
      <ErrorBoundary
        fallback={
          <div className="m26 m26-root" style={{ padding: '4rem 1.5rem', color: '#f4efe6' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Uzi Mir</h1>
            <p style={{ marginBottom: '1rem' }}>Head of Marketing · Jettribe</p>
            <button type="button" onClick={returnClassic} style={{ color: '#f0a04b' }}>
              ← Back to SellerOS
            </button>
          </div>
        }
      >
        <ModernPortfolio onReturnClassic={returnClassic} />
      </ErrorBoundary>
    )
  }

  return <SellerDesktop onEnter2026={enter2026} />
}
