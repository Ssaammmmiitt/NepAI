import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface StaggerOptions {
  delay?: number
  stagger?: number
  y?: number
  x?: number
  scale?: number
  duration?: number
  /** Re-run animation when this becomes true (e.g. after data loads). */
  enabled?: boolean
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Staggered entrance for siblings — ideal for grids and side-by-side layouts.
 */
export function useStaggerEntrance(
  selector = '[data-animate]',
  options?: StaggerOptions,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const enabled = options?.enabled ?? true

  useEffect(() => {
    if (!enabled || !containerRef.current || prefersReducedMotion()) return

    const targets = containerRef.current.querySelectorAll(selector)
    if (targets.length === 0) return

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: options?.y ?? 20,
        x: options?.x ?? 0,
        scale: options?.scale ?? 0.97,
        autoAlpha: 0,
        duration: options?.duration ?? 0.55,
        ease: 'power3.out',
        stagger: options?.stagger ?? 0.08,
        delay: options?.delay ?? 0.05,
        clearProps: 'transform',
      })
    }, containerRef)

    return () => ctx.revert()
  }, [selector, enabled, options?.delay, options?.stagger, options?.y, options?.x, options?.scale, options?.duration])

  return containerRef
}

/**
 * Vertical page-section reveals (stacked blocks).
 */
export function usePageEntrance(selector = '[data-section]', options?: StaggerOptions) {
  return useStaggerEntrance(selector, {
    y: 22,
    x: 0,
    scale: 0.98,
    stagger: 0.12,
    duration: 0.6,
    ...options,
  })
}

/**
 * Horizontal sibling reveals for columns / cards in a row.
 */
export function useRowEntrance(selector = '[data-animate]', options?: StaggerOptions) {
  return useStaggerEntrance(selector, {
    x: 28,
    y: 10,
    scale: 0.97,
    stagger: 0.1,
    duration: 0.5,
    ...options,
  })
}

/**
 * Fade-in animation for a single element.
 */
export function useFadeIn(options?: { delay?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        autoAlpha: 0,
        y: 12,
        scale: 0.98,
        duration: options?.duration ?? 0.5,
        ease: 'power3.out',
        delay: options?.delay ?? 0,
        clearProps: 'transform',
      })
    }, ref)

    return () => ctx.revert()
  }, [options?.delay, options?.duration])

  return ref
}

/**
 * Number counter animation (for stats).
 */
export function useCountUp(
  targetValue: number,
  options?: { duration?: number; decimals?: number },
) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current || !targetValue) return
    if (prefersReducedMotion()) {
      ref.current.textContent = targetValue.toFixed(options?.decimals ?? 0)
      return
    }

    const obj = { value: 0 }
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        value: targetValue,
        duration: options?.duration ?? 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = obj.value.toFixed(options?.decimals ?? 0)
          }
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [targetValue, options?.duration, options?.decimals])

  return ref
}
