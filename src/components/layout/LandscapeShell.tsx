import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { formatShellLabel } from '@/lib/appMeta'
import {
  computeShellBox,
  LANDSCAPE_ASPECT_CSS,
  LANDSCAPE_ASPECT_RATIO,
} from '@/lib/landscape'
import { NAV_ROUTES } from '@/routes/routeConfig'

export type ShellFrame = { width: number; height: number }

export interface LandscapeShellProps {
  /**
   * Optional fixed frame for tests. When omitted, the shell measures its
   * outer container and letterboxes via `computeShellBox`.
   */
  frame?: ShellFrame
}

export function LandscapeShell({ frame: frameProp }: LandscapeShellProps = {}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<ShellFrame>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (frameProp) return
    const node = outerRef.current
    if (!node) return

    const update = () => {
      setMeasured(computeShellBox(node.clientWidth, node.clientHeight))
    }

    update()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const ro = new ResizeObserver(() => update())
    ro.observe(node)
    return () => ro.disconnect()
  }, [frameProp])

  const frame = frameProp ?? measured
  const hasFrame = frame.width > 0 && frame.height > 0

  return (
    <div
      ref={outerRef}
      className="flex h-full min-h-full w-full items-center justify-center bg-black p-3 sm:p-4"
      data-testid="landscape-outer"
    >
      <div
        className="flex max-h-full max-w-full flex-col overflow-hidden rounded-xl border border-emerald-800/70 bg-gradient-to-b from-emerald-950 to-lime-950 shadow-2xl"
        style={
          hasFrame
            ? {
                width: frame.width,
                height: frame.height,
                aspectRatio: LANDSCAPE_ASPECT_CSS,
              }
            : {
                width: 'min(100%, calc((100vh - 2rem) * 16 / 9))',
                maxHeight: 'calc(100vh - 2rem)',
                aspectRatio: LANDSCAPE_ASPECT_CSS,
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
