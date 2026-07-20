import { describe, expect, it } from 'vitest'
import {
  contentBoxFromClient,
  fitLandscapeFrame,
  isLandscapeAspect,
  LANDSCAPE_ASPECT_CSS,
  LANDSCAPE_ASPECT_RATIO,
  measureShellFrame,
  shellBoxFromPaddedClient,
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

  it('fitLandscapeFrame letterboxes and pillarboxes on content box', () => {
    const wide = fitLandscapeFrame(1920, 800)
    expect(isLandscapeAspect(wide.width, wide.height)).toBe(true)
    expect(wide.height).toBe(800)
    expect(wide.width).toBe(Math.round(800 * (16 / 9)))

    const tall = fitLandscapeFrame(800, 1200)
    expect(isLandscapeAspect(tall.width, tall.height)).toBe(true)
    expect(tall.width).toBe(800)
    expect(tall.height).toBe(Math.round(800 / (16 / 9)))
  })
})

describe('padded outer measure path (production algorithm)', () => {
  const pad16 = { top: 16, right: 16, bottom: 16, left: 16 }

  it('contentBoxFromClient subtracts padding from client box', () => {
    // Skeptic case: outer 1600×500 with p-4 (16px) each side → content 1568×468
    expect(contentBoxFromClient(1600, 500, pad16)).toEqual({
      width: 1568,
      height: 468,
    })
  })

  it('shellBoxFromPaddedClient keeps 16:9 and fits inside content box', () => {
    // Using client (padding-box) size without subtracting padding would yield
    // ~889×500, then max-height clamp → distorted ratio. Correct path:
    const shell = shellBoxFromPaddedClient(1600, 500, pad16)
    const content = contentBoxFromClient(1600, 500, pad16)

    expect(isLandscapeAspect(shell.width, shell.height)).toBe(true)
    expect(shell.width).toBeLessThanOrEqual(content.width)
    expect(shell.height).toBeLessThanOrEqual(content.height)
    // Must NOT equal fit of the padding-box (that was the bug)
    const wrong = fitLandscapeFrame(1600, 500)
    expect(shell).not.toEqual(wrong)
    expect(shell.height).toBe(content.height)
    expect(shell.width).toBe(Math.round(content.height * (16 / 9)))
  })

  it('measureShellFrame uses element client size minus computed padding', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: 1600 })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: 500 })
    // jsdom getComputedStyle often returns 0 for class padding; set inline.
    el.style.padding = '16px'

    const shell = measureShellFrame(el)
    expect(isLandscapeAspect(shell.width, shell.height)).toBe(true)
    expect(shell.width).toBeLessThanOrEqual(1568)
    expect(shell.height).toBeLessThanOrEqual(468)
    expect(shell).toEqual(shellBoxFromPaddedClient(1600, 500, pad16))
  })
})
