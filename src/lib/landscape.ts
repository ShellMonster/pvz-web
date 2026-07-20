/** Design aspect for the game shell (width / height). */
export const LANDSCAPE_ASPECT_RATIO = 16 / 9

/** CSS `aspect-ratio` value used by LandscapeShell. */
export const LANDSCAPE_ASPECT_CSS = '16 / 9'

export type Size = { width: number; height: number }

export type PaddingBox = {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Whether a rectangle matches the 16:9 design aspect within epsilon.
 * Pure helper so tests do not depend on screenshots.
 */
export function isLandscapeAspect(
  width: number,
  height: number,
  epsilon = 0.02,
): boolean {
  if (width <= 0 || height <= 0) return false
  return Math.abs(width / height - LANDSCAPE_ASPECT_RATIO) <= epsilon
}

/**
 * Fit a 16:9 frame inside a content box (letterbox / pillarbox).
 * `viewportWidth` / `viewportHeight` must be the **content box**
 * (padding already excluded). Returns integer pixel sizes.
 */
export function fitLandscapeFrame(
  viewportWidth: number,
  viewportHeight: number,
): Size {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { width: 0, height: 0 }
  }

  const viewportRatio = viewportWidth / viewportHeight
  let width: number
  let height: number

  if (viewportRatio > LANDSCAPE_ASPECT_RATIO) {
    // Wider than 16:9 → pillarbox (limit by height)
    height = viewportHeight
    width = height * LANDSCAPE_ASPECT_RATIO
  } else {
    // Taller/narrower → letterbox (limit by width)
    width = viewportWidth
    height = width / LANDSCAPE_ASPECT_RATIO
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

/** Content-box size from client box minus padding (same model as CSS content-box). */
export function contentBoxFromClient(
  clientWidth: number,
  clientHeight: number,
  padding: PaddingBox,
): Size {
  return {
    width: Math.max(0, clientWidth - padding.left - padding.right),
    height: Math.max(0, clientHeight - padding.top - padding.bottom),
  }
}

/**
 * Production measure path: outer element uses border-box client size + CSS padding.
 * Shell must fit inside the **content box**, not the padding box.
 */
export function shellBoxFromPaddedClient(
  clientWidth: number,
  clientHeight: number,
  padding: PaddingBox,
): Size {
  const content = contentBoxFromClient(clientWidth, clientHeight, padding)
  return fitLandscapeFrame(content.width, content.height)
}

/** Read padding from a live element (shipped measure path). */
export function readElementPadding(el: Element): PaddingBox {
  const style = getComputedStyle(el)
  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  }
}

/**
 * Measure shell frame from an outer element using content box
 * (client size − padding). This is the production algorithm.
 */
export function measureShellFrame(el: HTMLElement): Size {
  return shellBoxFromPaddedClient(
    el.clientWidth,
    el.clientHeight,
    readElementPadding(el),
  )
}

/** @deprecated use fitLandscapeFrame on content box; kept as alias */
export function computeShellBox(
  containerWidth: number,
  containerHeight: number,
): Size {
  return fitLandscapeFrame(containerWidth, containerHeight)
}
