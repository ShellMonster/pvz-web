import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { formatShellLabel } from '@/lib/appMeta'
import {
  contentBoxFromClient,
  isLandscapeAspect,
  LANDSCAPE_ASPECT_CSS,
  LANDSCAPE_ASPECT_RATIO,
  shellBoxFromPaddedClient,
} from '@/lib/landscape'
import { AppRoutes } from '@/routes/AppRoutes'
import { APP_ROUTES, gamePath, getRouteById } from '@/routes/routeConfig'
import type { SimulateClient } from '@/components/layout/LandscapeShell'

function renderAt(path: string, simulateClient?: SimulateClient) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes simulateClient={simulateClient} />
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
    ['/', 'page-home', /植物大战僵尸|首页/],
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
    expect(screen.getByTestId('game-level-id')).toHaveTextContent(`关卡 ${levelId}`)
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

describe('LandscapeShell letterbox via real measure path', () => {
  it('fits short-wide padded outer without distorting 16:9', () => {
    // Inject raw client metrics + padding (NOT a pre-fitted box).
    // Outer 1600×500, p-4 → content 1568×468; shell must fit that content box.
    const simulateClient: SimulateClient = {
      width: 1600,
      height: 500,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
    }
    const content = contentBoxFromClient(
      simulateClient.width,
      simulateClient.height,
      simulateClient.padding,
    )
    const expected = shellBoxFromPaddedClient(
      simulateClient.width,
      simulateClient.height,
      simulateClient.padding,
    )

    renderAt('/', simulateClient)

    const shell = screen.getByTestId('landscape-shell')
    const w = Number(shell.getAttribute('data-shell-width'))
    const h = Number(shell.getAttribute('data-shell-height'))

    expect(w).toBe(expected.width)
    expect(h).toBe(expected.height)
    expect(w).toBeLessThanOrEqual(content.width)
    expect(h).toBeLessThanOrEqual(content.height)
    expect(isLandscapeAspect(w, h)).toBe(true)
    expect(shell).toHaveStyle({
      width: `${expected.width}px`,
      height: `${expected.height}px`,
      aspectRatio: LANDSCAPE_ASPECT_CSS,
    })
    // Prove we did not size against the padding-box height (500).
    expect(h).toBeLessThan(500)
    expect(h).toBe(content.height)
    expect(shell).toHaveAttribute(
      'data-aspect-ratio',
      String(LANDSCAPE_ASPECT_RATIO),
    )
    expect(
      screen.getByRole('heading', { name: formatShellLabel() }),
    ).toBeInTheDocument()
  })

  it('letterboxes tall padded containers (limit by content width)', () => {
    const simulateClient: SimulateClient = {
      width: 900,
      height: 1400,
      padding: { top: 12, right: 12, bottom: 12, left: 12 },
    }
    const content = contentBoxFromClient(
      simulateClient.width,
      simulateClient.height,
      simulateClient.padding,
    )
    const expected = shellBoxFromPaddedClient(
      simulateClient.width,
      simulateClient.height,
      simulateClient.padding,
    )

    renderAt('/levels', simulateClient)
    const shell = screen.getByTestId('landscape-shell')
    const w = Number(shell.getAttribute('data-shell-width'))
    const h = Number(shell.getAttribute('data-shell-height'))

    expect(w).toBe(expected.width)
    expect(h).toBe(expected.height)
    expect(w).toBeLessThanOrEqual(content.width)
    expect(h).toBeLessThanOrEqual(content.height)
    expect(isLandscapeAspect(w, h)).toBe(true)
    expect(h).toBeLessThan(content.height)
  })
})
