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

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...defaultProgress(),
  hydrate: () => {
    set(loadProgress())
  },
  unlockSeenPlant: (id) => {
    const state = get()
    if (state.seenCodex.plants.includes(id)) return
    const next: ProgressSave = {
      ...state,
      seenCodex: {
        ...state.seenCodex,
        plants: [...state.seenCodex.plants, id],
      },
    }
    persist(next)
    set(next)
  },
  unlockSeenZombie: (id) => {
    const state = get()
    if (state.seenCodex.zombies.includes(id)) return
    const next: ProgressSave = {
      ...state,
      seenCodex: {
        ...state.seenCodex,
        zombies: [...state.seenCodex.zombies, id],
      },
    }
    persist(next)
    set(next)
  },
  recordWin: (levelId, stars) => {
    const next = applyWinProgress(get(), levelId, stars)
    persist(next)
    set(next)
  },
  resetProgress: () => {
    clearProgress()
    const next = defaultProgress()
    persist(next)
    set(next)
  },
  isUnlocked: (levelId) => isLevelUnlocked(get(), levelId),
}))
