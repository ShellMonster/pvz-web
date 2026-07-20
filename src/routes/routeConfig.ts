export type AppRouteId = 'home' | 'levels' | 'game' | 'codex' | 'settings'

export interface AppRouteDef {
  id: AppRouteId
  /** React Router path pattern */
  path: string
  /** Page heading shown inside the shell */
  title: string
  /** data-testid for the page root */
  testId: string
  /** Bottom/side nav label; null = not listed in primary nav */
  navLabel: string | null
}

/**
 * Single source of truth for app routes — used by router and tests.
 * Paths match PLAN §2.1.
 */
export const APP_ROUTES: readonly AppRouteDef[] = [
  {
    id: 'home',
    path: '/',
    title: '首页',
    testId: 'page-home',
    navLabel: '首页',
  },
  {
    id: 'levels',
    path: '/levels',
    title: '选关',
    testId: 'page-levels',
    navLabel: '选关',
  },
  {
    id: 'game',
    path: '/game/:levelId',
    title: '战斗',
    testId: 'page-game',
    navLabel: null,
  },
  {
    id: 'codex',
    path: '/codex',
    title: '图鉴',
    testId: 'page-codex',
    navLabel: '图鉴',
  },
  {
    id: 'settings',
    path: '/settings',
    title: '设置',
    testId: 'page-settings',
    navLabel: '设置',
  },
] as const

export const NAV_ROUTES = APP_ROUTES.filter((r) => r.navLabel !== null)

export function getRouteById(id: AppRouteId): AppRouteDef {
  const route = APP_ROUTES.find((r) => r.id === id)
  if (!route) {
    throw new Error(`Unknown route id: ${id}`)
  }
  return route
}

/** Concrete path for a game level (not the pattern). */
export function gamePath(levelId: string): string {
  return `/game/${encodeURIComponent(levelId)}`
}
