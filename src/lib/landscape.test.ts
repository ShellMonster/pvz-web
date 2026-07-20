import { describe, expect, it } from 'vitest'
import {
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
    expect(wide.width).toBeCloseTo(800 * (16 / 9), 5)

    const tall = fitLandscapeFrame(800, 1200)
    expect(isLandscapeAspect(tall.width, tall.height)).toBe(true)
    expect(tall.width).toBe(800)
    expect(tall.height).toBeCloseTo(800 / (16 / 9), 5)
  })
})
