import { create } from 'zustand'
import {
  applyWinProgress,
  clearProgress,
  defaultProgress,
  isLevelUnlocked,
  loadProgress,
  saveProgress,
} from '@/lib/storage'
import type { ProgressSave } from '@/types/save'

interface ProgressState extends ProgressSave {
  hydrated: boolean
  hydrate: () => void
  unlockSeenPlant: (id: string) => void
  unlockSeenZombie: (id: string) => void
  recordWin: (levelId: string, stars: 1 | 2 | 3) => void
  resetProgress: () => void
  isUnlocked: (levelId: string) => boolean
}

function persist(partial: ProgressSave) {
  saveProgress(partial)
}

/**
 * Always re-read localStorage before mutating so a cold GamePage mount
 * cannot clobber prior unlocks with defaultProgress().
 */
function withStoredBase(
  memory: ProgressSave,
  fn: (base: ProgressSave) => ProgressSave,
): ProgressSave {
  const stored = loadProgress()
  // Prefer stored for unlock/stars; merge in-memory codex extras if any
  const base: ProgressSave = {
    ...stored,
    seenCodex: {
      plants: Array.from(
        new Set([...stored.seenCodex.plants, ...memory.seenCodex.plants]),
      ),
      zombies: Array.from(
        new Set([...stored.seenCodex.zombies, ...memory.seenCodex.zombies]),
      ),
    },
  }
  return fn(base)
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...defaultProgress(),
  hydrated: false,
  hydrate: () => {
    set({ ...loadProgress(), hydrated: true })
  },
  unlockSeenPlant: (id) => {
    const next = withStoredBase(get(), (base) => {
      if (base.seenCodex.plants.includes(id)) return base
      return {
        ...base,
        seenCodex: {
          ...base.seenCodex,
          plants: [...base.seenCodex.plants, id],
        },
      }
    })
    persist(next)
    set({ ...next, hydrated: true })
  },
  unlockSeenZombie: (id) => {
    const next = withStoredBase(get(), (base) => {
      if (base.seenCodex.zombies.includes(id)) return base
      return {
        ...base,
        seenCodex: {
          ...base.seenCodex,
          zombies: [...base.seenCodex.zombies, id],
        },
      }
    })
    persist(next)
    set({ ...next, hydrated: true })
  },
  recordWin: (levelId, stars) => {
    const next = withStoredBase(get(), (base) =>
      applyWinProgress(base, levelId, stars),
    )
    persist(next)
    set({ ...next, hydrated: true })
  },
  resetProgress: () => {
    clearProgress()
    const next = defaultProgress()
    persist(next)
    set({ ...next, hydrated: true })
  },
  isUnlocked: (levelId) => {
    const state = get()
    const base = state.hydrated ? state : loadProgress()
    return isLevelUnlocked(base, levelId)
  },
}))
