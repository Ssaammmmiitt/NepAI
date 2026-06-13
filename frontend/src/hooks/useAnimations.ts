import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface StaggerOptions {
  delay?: number
  stagger?: number
  y?: number
  /** Re-run animation when this becomes true (e.g. after data loads). */
  enabled?: boolean
}

/**
 * Staggered entrance animation for a container's children.
 * Respects prefers-reduced-motion. Skips if no targets are found.
 */
export function useStaggerEntrance(
  selector = '[data-animate]',
  options?: StaggerOptions,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const enabled = options?.enabled ?? true

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const targets = containerRef.current.querySelectorAll(selector)
    if (targets.length === 0) return

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: options?.y ?? 20,
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: options?.stagger ?? 0.08,
        delay: options?.delay ?? 0.1,
      })
    }, containerRef)

    return () => ctx.revert()
  }, [selector, enabled, options?.delay, options?.stagger, options?.y])

  return containerRef
}

/**
 * Fade-in animation for a single element.
 */
export function useFadeIn(options?: { delay?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    gsap.from(ref.current, {
      autoAlpha: 0,
      y: 12,
      duration: options?.duration ?? 0.5,
      ease: 'power2.out',
      delay: options?.delay ?? 0,
    })
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
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      ref.current.textContent = targetValue.toFixed(options?.decimals ?? 0)
      return
    }

    const obj = { value: 0 }
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
  }, [targetValue, options?.duration, options?.decimals])

  return ref
}
