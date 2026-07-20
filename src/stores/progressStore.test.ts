import { beforeEach, describe, expect, it } from 'vitest'
import { PROGRESS_KEY, saveProgress, defaultProgress, applyWinProgress } from '@/lib/storage'
import { useProgressStore } from '@/stores/progressStore'

describe('progressStore recordWin without prior hydrate', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState({ ...defaultProgress(), hydrated: false })
  })

  it('does not clobber existing localStorage unlocks when recordWin runs cold', () => {
    // Simulate prior session: user already unlocked through 1-3
    const stored = applyWinProgress(
      applyWinProgress(defaultProgress(), '1-1', 3),
      '1-2',
      2,
    )
    expect(stored.unlockedLevelId).toBe('1-3')
    saveProgress(stored)

    // Cold store (defaultProgress in memory, hydrated false) — GamePage bug path
    useProgressStore.setState({ ...defaultProgress(), hydrated: false })
    useProgressStore.getState().recordWin('1-1', 1)

    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY)!)
    expect(raw.unlockedLevelId).toBe('1-3')
    expect(raw.stars['1-2']).toBe(2)
    expect(raw.stars['1-1']).toBe(3)
  })

  it('hydrate loads stored unlock before UI reads it', () => {
    saveProgress(applyWinProgress(defaultProgress(), '1-1', 1))
    useProgressStore.getState().hydrate()
    expect(useProgressStore.getState().unlockedLevelId).toBe('1-2')
    expect(useProgressStore.getState().hydrated).toBe(true)
  })
})
