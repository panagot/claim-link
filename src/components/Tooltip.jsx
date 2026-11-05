import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Instrument footnote tooltip.
 * The bubble is rendered in a portal on <body> with fixed positioning so it
 * escapes ancestor stacking contexts (CSS animations with fill-mode leave a
 * lingering identity-matrix transform) and overflow clipping. Props: title,
 * body (or legacy `label`), href, hrefLabel, wide, compact, hideMark.
 */
export default function Tooltip({
  title,
  body,
  label,
  href,
  hrefLabel = 'Learn more',
  children,
  wide,
  compact,
  hideMark,
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const wrapRef = useRef(null)

  const eyebrow = title || null
  const text = body || label || ''

  const place = useCallback(() => {
    if (!wrapRef.current) return
    const r = wrapRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const width = compact ? 240 : wide ? 300 : 320
    const left = Math.max(12, Math.min(r.left, vw - width - 12))
    const flipUp = r.bottom + 170 > window.innerHeight && r.top > 190
    setPos({
      left,
      width,
      top: flipUp ? null : Math.round(r.bottom + 8),
      bottom: flipUp ? Math.round(window.innerHeight - r.top + 8) : null,
    })
  }, [compact, wide])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  // Reposition / dismiss on scroll or resize while open (fixed bubble would detach).
  useEffect(() => {
    if (!open) return undefined
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const bubble =
    open && pos
      ? createPortal(
          <span
            role="tooltip"
            id={id}
            className={`tip-bubble tip-portal ${compact ? 'compact' : ''} ${wide ? 'wide' : ''}`}
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top ?? undefined,
              bottom: pos.bottom ?? undefined,
              maxWidth: pos.width,
            }}
          >
            {eyebrow ? <span className="tip-title">{eyebrow}</span> : null}
            <span className="tip-body">{text}</span>
            {href ? (
              <a className="tip-link" href={href} target="_blank" rel="noreferrer">
                {hrefLabel}
              </a>
            ) : null}
          </span>,
          document.body,
        )
      : null

  return (
    <span
      ref={wrapRef}
      className={`tip ${wide ? 'wide' : ''} ${compact ? 'compact' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="tip-btn"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
      >
        {children}
        {hideMark ? null : (
          <span className="tip-mark" aria-hidden="true">
            ?
          </span>
        )}
      </button>
      {bubble}
    </span>
  )
}
