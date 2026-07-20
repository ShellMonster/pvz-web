import { describe, expect, it } from 'vitest'
import {
  applyWinProgress,
  clearProgress,
  defaultProgress,
  isLevelUnlocked,
  loadProgress,
  PROGRESS_KEY,
  saveProgress,
} from '@/lib/storage'

function memStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
  }
}

describe('progress storage', () => {
  it('defaults unlock 1-1 and persists win unlock', () => {
    const s = memStorage()
    const base = defaultProgress()
    expect(base.unlockedLevelId).toBe('1-1')
    expect(isLevelUnlocked(base, '1-1')).toBe(true)
    expect(isLevelUnlocked(base, '1-2')).toBe(false)

    const won = applyWinProgress(base, '1-1', 2)
    expect(won.unlockedLevelId).toBe('1-2')
    expect(won.stars['1-1']).toBe(2)
    saveProgress(won, s)
    const loaded = loadProgress(s)
    expect(loaded.unlockedLevelId).toBe('1-2')
    expect(s.getItem(PROGRESS_KEY)).toContain('1-2')
  })

  it('reset clears storage', () => {
    const s = memStorage()
    saveProgress(applyWinProgress(defaultProgress(), '1-1', 1), s)
    clearProgress(s)
    expect(s.getItem(PROGRESS_KEY)).toBeNull()
    expect(loadProgress(s).unlockedLevelId).toBe('1-1')
  })

  it('applyWinProgress preserves earlier unlocks when base is stored progress', () => {
    let progress = defaultProgress()
    progress = applyWinProgress(progress, '1-1', 2)
    progress = applyWinProgress(progress, '1-2', 1)
    expect(progress.unlockedLevelId).toBe('1-3')
    expect(progress.stars['1-1']).toBe(2)
    // Winning 1-1 again must not wipe 1-2 stars or unlock
    const again = applyWinProgress(progress, '1-1', 1)
    expect(again.unlockedLevelId).toBe('1-3')
    expect(again.stars['1-1']).toBe(2)
    expect(again.stars['1-2']).toBe(1)
  })
})

