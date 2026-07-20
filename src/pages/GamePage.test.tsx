import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePage } from '@/pages/GamePage'

vi.mock('@/game/canvasRenderer', () => ({
  loadAssets: vi.fn(async () => ({
    plants: {},
    zombies: {},
    sun: null,
    pea: null,
    snowPea: null,
    firePea: null,
    mower: null,
    lawn: null,
    house: null,
  })),
  startCanvasBattle: vi.fn(() => ({ destroy: vi.fn() })),
}))

function renderGame(levelId = '1-1') {
  return render(
    <MemoryRouter initialEntries={[`/game/${levelId}`]}>
      <Routes>
        <Route path="/game/:levelId" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GamePage canvas host mount contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('always renders battle-canvas-host on first paint', () => {
    renderGame('1-1')
    expect(screen.getByTestId('battle-canvas-host')).toBeInTheDocument()
    expect(screen.getByTestId('page-game')).toBeInTheDocument()
    expect(screen.getByTestId('game-level-id')).toHaveTextContent('关卡 1-1')
    expect(screen.getByTestId('sun-count')).toBeInTheDocument()
    expect(screen.queryByText('加载战场…')).not.toBeInTheDocument()
  })

  it('exposes plant cards and sun from engine without waiting for canvas', () => {
    renderGame('1-1')
    expect(screen.getByTestId('card-sunflower')).toBeInTheDocument()
    expect(screen.getByTestId('card-peashooter')).toBeInTheDocument()
    expect(screen.getByTestId('sun-count').textContent).toMatch(/150/)
  })
})
