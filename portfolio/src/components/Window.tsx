import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

type Props = {
  id: string
  title: string
  active: boolean
  x: number
  y: number
  width?: number
  status?: string
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  children: ReactNode
}

export function Window({
  id,
  title,
  active,
  x,
  y,
  width = 460,
  status = 'Ready',
  onFocus,
  onClose,
  onMove,
  children,
}: Props) {
  const dragging = useRef(false)
  const origin = useRef({ px: 0, py: 0, x: 0, y: 0 })
  const [local, setLocal] = useState({ x, y })

  useEffect(() => {
    setLocal({ x, y })
  }, [x, y])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    onFocus(id)
    dragging.current = true
    origin.current = { px: e.clientX, py: e.clientY, x: local.x, y: local.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const nx = origin.current.x + (e.clientX - origin.current.px)
    const ny = Math.max(0, origin.current.y + (e.clientY - origin.current.py))
    setLocal({ x: nx, y: ny })
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    onMove(id, local.x, local.y)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={`sos-window ${active ? 'is-active' : ''}`}
      style={{ left: local.x, top: local.y, width }}
      onMouseDown={() => onFocus(id)}
    >
      <div
        className="sos-window__titlebar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span>{title}</span>
        <div className="sos-window__controls">
          <button type="button" className="sos-window__btn" aria-label="Minimize" onClick={() => onFocus(id)}>
            _
          </button>
          <button type="button" className="sos-window__btn" aria-label="Maximize">
            □
          </button>
          <button type="button" className="sos-window__btn is-close" aria-label="Close" onClick={() => onClose(id)}>
            ×
          </button>
        </div>
      </div>
      <div className="sos-window__menubar" aria-hidden>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Help</span>
      </div>
      <div className="sos-window__body">{children}</div>
      <div className="sos-window__status">{status}</div>
    </div>
  )
}
