import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { formatShellLabel } from '@/lib/appMeta'
import {
  LANDSCAPE_ASPECT_CSS,
  LANDSCAPE_ASPECT_RATIO,
  measureShellFrame,
  shellBoxFromPaddedClient,
  type PaddingBox,
  type Size,
} from '@/lib/landscape'
import { NAV_ROUTES } from '@/routes/routeConfig'

export type ShellFrame = Size

/**
 * Test hook: inject **raw outer client metrics** (not a pre-fitted box).
 * Production measures the DOM via `measureShellFrame`.
 */
export type SimulateClient = {
  width: number
  height: number
  padding: PaddingBox
}

export interface LandscapeShellProps {
  /** @internal test-only: drive measure path without ResizeObserver/DOM layout */
  simulateClient?: SimulateClient
}

export function LandscapeShell({
  simulateClient,
}: LandscapeShellProps = {}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<ShellFrame>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (simulateClient) {
      setMeasured(
        shellBoxFromPaddedClient(
          simulateClient.width,
          simulateClient.height,
          simulateClient.padding,
        ),
      )
      return
    }

    const node = outerRef.current
    if (!node) return

    const update = () => {
      setMeasured(measureShellFrame(node))
    }

    update()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    // contentBoxSize / contentRect exclude padding — still re-read via
    // measureShellFrame so client+padding math stays the single source of truth.
    const ro = new ResizeObserver(() => update())
    ro.observe(node)
    return () => ro.disconnect()
  }, [simulateClient])

  const frame = measured
  const hasFrame = frame.width > 0 && frame.height > 0

  return (
    <div
      ref={outerRef}
      className="box-border flex h-full min-h-full w-full items-center justify-center bg-black p-3 sm:p-4"
      data-testid="landscape-outer"
    >
      <div
        className="flex flex-col overflow-hidden rounded-xl border border-emerald-800/70 bg-gradient-to-b from-emerald-950 to-lime-950 shadow-2xl"
        style={
          hasFrame
            ? {
                width: frame.width,
                height: frame.height,
                // Explicit width+height already encode 16:9; keep aspect-ratio
                // as a CSS hint for layout engines without max-* clamping.
                aspectRatio: LANDSCAPE_ASPECT_CSS,
                maxWidth: 'none',
                maxHeight: 'none',
              }
            : {
                width: 'min(100%, calc((100dvh - 2rem) * 16 / 9))',
                height: 'auto',
                aspectRatio: LANDSCAPE_ASPECT_CSS,
                maxHeight: 'calc(100dvh - 2rem)',
              }
        }
        data-testid="landscape-shell"
        data-aspect-ratio={String(LANDSCAPE_ASPECT_RATIO)}
        data-shell-width={hasFrame ? String(frame.width) : undefined}
        data-shell-height={hasFrame ? String(frame.height) : undefined}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-900/80 px-4 py-2">
          <h1 className="truncate text-sm font-semibold text-lime-100 sm:text-base">
            {formatShellLabel()}
          </h1>
          <nav
            className="flex flex-wrap items-center justify-end gap-1 sm:gap-2"
            aria-label="主导航"
          >
            {NAV_ROUTES.map((route) => (
              <NavLink
                key={route.id}
                to={route.path}
                end={route.path === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-md px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400 sm:text-sm',
                    isActive
                      ? 'bg-lime-700/80 text-white'
                      : 'text-emerald-100/80 hover:bg-emerald-900/60',
                  ].join(' ')
                }
              >
                {route.navLabel}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
