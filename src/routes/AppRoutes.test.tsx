import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { formatShellLabel } from '@/lib/appMeta'
import { LANDSCAPE_ASPECT_CSS, LANDSCAPE_ASPECT_RATIO } from '@/lib/landscape'
import { AppRoutes } from '@/routes/AppRoutes'
import { APP_ROUTES, gamePath, getRouteById } from '@/routes/routeConfig'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('APP_ROUTES config', () => {
  it('declares the five PLAN paths including game param', () => {
    const paths = APP_ROUTES.map((r) => r.path)
    expect(paths).toEqual(['/', '/levels', '/game/:levelId', '/codex', '/settings'])
  })
})

describe('AppRoutes navigation', () => {
  it.each([
    ['/', 'page-home', '首页'],
    ['/levels', 'page-levels', '选关'],
    ['/codex', 'page-codex', '图鉴'],
    ['/settings', 'page-settings', '设置'],
  ] as const)('renders %s as %s', (path, testId, title) => {
    renderAt(path)
    const page = screen.getByTestId(testId)
    expect(page).toBeInTheDocument()
    expect(within(page).getByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.getByTestId('landscape-shell')).toBeInTheDocument()
  })

  it('renders game page with levelId param', () => {
    const levelId = '1-1'
    renderAt(gamePath(levelId))
    expect(screen.getByTestId(getRouteById('game').testId)).toBeInTheDocument()
    expect(screen.getByTestId('game-level-id')).toHaveTextContent(levelId)
  })

  it('navigates via shell nav links without losing the shell', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(screen.getByTestId('page-home')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '选关' }))
    expect(screen.getByTestId('page-levels')).toBeInTheDocument()
    expect(screen.getByTestId('landscape-shell')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '图鉴' }))
    expect(screen.getByTestId('page-codex')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '设置' }))
    expect(screen.getByTestId('page-settings')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '首页' }))
    expect(screen.getByTestId('page-home')).toBeInTheDocument()
  })
})

describe('LandscapeShell contract', () => {
  it('applies 16:9 aspect ratio from landscape helpers', () => {
    renderAt('/')
    const shell = screen.getByTestId('landscape-shell')
    expect(shell).toHaveStyle({ aspectRatio: LANDSCAPE_ASPECT_CSS })
    expect(shell).toHaveAttribute('data-aspect-ratio', String(LANDSCAPE_ASPECT_RATIO))
    expect(
      screen.getByRole('heading', { name: formatShellLabel() }),
    ).toBeInTheDocument()
  })
})
