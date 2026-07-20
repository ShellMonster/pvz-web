import { NavLink, Outlet } from 'react-router-dom'
import { formatShellLabel } from '@/lib/appMeta'
import {
  LANDSCAPE_ASPECT_CSS,
  LANDSCAPE_ASPECT_RATIO,
} from '@/lib/landscape'
import { NAV_ROUTES } from '@/routes/routeConfig'

export function LandscapeShell() {
  return (
    <div className="flex min-h-full items-center justify-center bg-black p-3 sm:p-4">
      <div
        className="flex w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-emerald-800/70 bg-gradient-to-b from-emerald-950 to-lime-950 shadow-2xl"
        style={{ aspectRatio: LANDSCAPE_ASPECT_CSS }}
        data-testid="landscape-shell"
        data-aspect-ratio={String(LANDSCAPE_ASPECT_RATIO)}
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
                    'rounded-md px-2 py-1 text-xs sm:text-sm',
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
