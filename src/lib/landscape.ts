/** Design aspect for the game shell (width / height). */
export const LANDSCAPE_ASPECT_RATIO = 16 / 9

/** CSS `aspect-ratio` value used by LandscapeShell. */
export const LANDSCAPE_ASPECT_CSS = '16 / 9'

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
 * Fit a 16:9 frame inside a viewport (letterbox / pillarbox).
 * Returns integer pixel sizes for the content rectangle.
 */
export function fitLandscapeFrame(
  viewportWidth: number,
  viewportHeight: number,
): { width: number; height: number } {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { width: 0, height: 0 }
  }

  const viewportRatio = viewportWidth / viewportHeight
  let width: number
  let height: number

  if (viewportRatio > LANDSCAPE_ASPECT_RATIO) {
    // Viewport wider than 16:9 → pillarbox (limit by height)
    height = viewportHeight
    width = height * LANDSCAPE_ASPECT_RATIO
  } else {
    // Viewport taller/narrower → letterbox (limit by width)
    width = viewportWidth
    height = width / LANDSCAPE_ASPECT_RATIO
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

/** Alias used by the shell for container → content box. */
export function computeShellBox(
  containerWidth: number,
  containerHeight: number,
): { width: number; height: number } {
  return fitLandscapeFrame(containerWidth, containerHeight)
}
