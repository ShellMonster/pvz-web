import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Radix UI (Slider etc.) needs ResizeObserver in jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// jsdom lacks canvas; Phaser feature detect must not throw if accidentally imported.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
HTMLCanvasElement.prototype.getContext = vi.fn(() => {
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    clearRect: vi.fn(),
    canvas: document.createElement('canvas'),
  }
}) as unknown as typeof HTMLCanvasElement.prototype.getContext

// Never boot real Phaser in unit tests (GamePage dynamic-imports this).
vi.mock('@/game/createGame', () => ({
  createBattleGame: vi.fn(() => ({
    destroy: vi.fn(),
  })),
}))
