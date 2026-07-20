import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { GamePage } from '@/pages/GamePage'

// Phaser must not load in jsdom; createGame is dynamic-imported.
vi.mock('@/game/createGame', () => ({
  createBattleGame: vi.fn(() => ({
    destroy: vi.fn(),
  })),
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

describe('GamePage Phaser host mount contract', () => {
  it('always renders battle-canvas-host on first paint (no snap gate)', () => {
    renderGame('1-1')

    // Critical: host must exist immediately so useLayoutEffect can attach Phaser.
    const host = screen.getByTestId('battle-canvas-host')
    expect(host).toBeInTheDocument()
    expect(screen.getByTestId('page-game')).toBeInTheDocument()
    expect(screen.getByTestId('game-level-id')).toHaveTextContent('1-1')
    expect(screen.getByTestId('sun-count')).toBeInTheDocument()
    // Must not show the old "loading only" shell without host
    expect(screen.queryByText('加载战场…')).not.toBeInTheDocument()
  })

  it('exposes plant cards and sun from engine without waiting for Phaser', () => {
    renderGame('1-1')
    expect(screen.getByTestId('card-sunflower')).toBeInTheDocument()
    expect(screen.getByTestId('card-peashooter')).toBeInTheDocument()
    // Initial sun from level 1-1 config
    expect(screen.getByTestId('sun-count').textContent).toMatch(/150/)
  })
})
