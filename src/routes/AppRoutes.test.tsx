import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { formatShellLabel } from '@/lib/appMeta'
import {
  computeShellBox,
  isLandscapeAspect,
  LANDSCAPE_ASPECT_CSS,
  LANDSCAPE_ASPECT_RATIO,
} from '@/lib/landscape'
import { AppRoutes } from '@/routes/AppRoutes'
import { APP_ROUTES, gamePath, getRouteById } from '@/routes/routeConfig'

function renderAt(
  path: string,
  options?: { shellFrame?: { width: number; height: number } },
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes shellFrame={options?.shellFrame} />
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

  it('redirects unknown paths to home', () => {
    renderAt('/nope')
    expect(screen.getByTestId('page-home')).toBeInTheDocument()
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

describe('LandscapeShell letterbox contract', () => {
  it('applies computeShellBox dimensions for a short-wide container', () => {
    // Short wide viewport: content must not use full width (pillarbox).
    const container = { width: 1600, height: 500 }
    const expected = computeShellBox(container.width, container.height)

    renderAt('/', { shellFrame: expected })

    const shell = screen.getByTestId('landscape-shell')
    expect(shell).toHaveAttribute('data-shell-width', String(expected.width))
    expect(shell).toHaveAttribute('data-shell-height', String(expected.height))
    expect(shell).toHaveStyle({
      width: `${expected.width}px`,
      height: `${expected.height}px`,
      aspectRatio: LANDSCAPE_ASPECT_CSS,
    })
    expect(isLandscapeAspect(expected.width, expected.height)).toBe(true)
    expect(expected.width).toBeLessThan(container.width)
    expect(expected.height).toBe(container.height)
    expect(shell).toHaveAttribute(
      'data-aspect-ratio',
      String(LANDSCAPE_ASPECT_RATIO),
    )
    expect(
      screen.getByRole('heading', { name: formatShellLabel() }),
    ).toBeInTheDocument()
  })

  it('letterboxes tall containers (limit by width)', () => {
    const expected = computeShellBox(900, 1400)
    renderAt('/levels', { shellFrame: expected })
    const shell = screen.getByTestId('landscape-shell')
    expect(Number(shell.getAttribute('data-shell-width'))).toBe(expected.width)
    expect(Number(shell.getAttribute('data-shell-height'))).toBe(expected.height)
    expect(isLandscapeAspect(expected.width, expected.height)).toBe(true)
    expect(expected.height).toBeLessThan(1400)
  })
})
