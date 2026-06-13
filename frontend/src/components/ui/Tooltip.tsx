import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  /** Skip rendering the tooltip (e.g. nothing useful to show). */
  disabled?: boolean
  side?: 'top' | 'bottom'
  className?: string
}

export function Tooltip({
  content,
  children,
  disabled = false,
  side = 'top',
  className = '',
}: TooltipProps) {
  const id = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({
      x: rect.left + rect.width / 2,
      y: side === 'top' ? rect.top - 8 : rect.bottom + 8,
    })
  }, [side])

  const show = useCallback(() => {
    if (disabled || !content) return
    updatePosition()
    setOpen(true)
  }, [content, disabled, updatePosition])

  const hide = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onScroll = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, updatePosition])

  if (disabled || !content) {
    return <>{children}</>
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex max-w-full ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </span>
      {open
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              style={{
                position: 'fixed',
                left: coords.x,
                top: coords.y,
                transform: side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                zIndex: 60,
              }}
              className="pointer-events-none max-w-[16rem] border border-dt-border bg-dt-surface px-3 py-2 shadow-[4px_4px_0_0_var(--dt-shadow)]"
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
