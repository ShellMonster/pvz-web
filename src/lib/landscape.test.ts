import { describe, expect, it } from 'vitest'
import {
  computeShellBox,
  fitLandscapeFrame,
  isLandscapeAspect,
  LANDSCAPE_ASPECT_CSS,
  LANDSCAPE_ASPECT_RATIO,
} from '@/lib/landscape'

describe('landscape aspect contract', () => {
  it('exports 16:9 ratio and CSS form used by the shell', () => {
    expect(LANDSCAPE_ASPECT_RATIO).toBeCloseTo(16 / 9, 5)
    expect(LANDSCAPE_ASPECT_CSS).toBe('16 / 9')
  })

  it('isLandscapeAspect accepts exact 16:9 rectangles', () => {
    expect(isLandscapeAspect(1600, 900)).toBe(true)
    expect(isLandscapeAspect(1280, 720)).toBe(true)
    expect(isLandscapeAspect(100, 100)).toBe(false)
    expect(isLandscapeAspect(0, 9)).toBe(false)
  })

  it('fitLandscapeFrame letterboxes and pillarboxes while keeping 16:9', () => {
    const wide = fitLandscapeFrame(1920, 800)
    expect(isLandscapeAspect(wide.width, wide.height)).toBe(true)
    expect(wide.height).toBe(800)
    expect(wide.width).toBe(Math.round(800 * (16 / 9)))

    const tall = fitLandscapeFrame(800, 1200)
    expect(isLandscapeAspect(tall.width, tall.height)).toBe(true)
    expect(tall.width).toBe(800)
    expect(tall.height).toBe(Math.round(800 / (16 / 9)))
  })

  it('computeShellBox matches fitLandscapeFrame for short-wide viewports', () => {
    // PLAN N2 case: short landscape window must shrink height-first (pillarbox)
    const box = computeShellBox(1600, 500)
    expect(box).toEqual(fitLandscapeFrame(1600, 500))
    expect(isLandscapeAspect(box.width, box.height)).toBe(true)
    expect(box.height).toBe(500)
    expect(box.width).toBeLessThan(1600)
  })
})
