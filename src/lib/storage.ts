import type { ProgressSave, SettingsSave } from '@/types/save'
import { LEVEL_ORDER } from '@/data/levels'

export const PROGRESS_KEY = 'pvz-web-progress-v1'

export const DEFAULT_SETTINGS: SettingsSave = {
  bgm: 0.6,
  sfx: 0.8,
  reduceParticles: false,
  gameSpeed: 1,
}

export function defaultProgress(): ProgressSave {
  return {
    version: 1,
    unlockedLevelId: LEVEL_ORDER[0]!,
    stars: {},
    seenCodex: { plants: [], zombies: [] },
    settings: { ...DEFAULT_SETTINGS },
  }
}

export function loadProgress(
  storage: Pick<Storage, 'getItem'> = localStorage,
): ProgressSave {
  try {
    const raw = storage.getItem(PROGRESS_KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as ProgressSave
    if (parsed.version !== 1) return defaultProgress()
    return {
      ...defaultProgress(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      seenCodex: {
        plants: parsed.seenCodex?.plants ?? [],
        zombies: parsed.seenCodex?.zombies ?? [],
      },
      stars: parsed.stars ?? {},
    }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(
  data: ProgressSave,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(PROGRESS_KEY, JSON.stringify(data))
}

export function clearProgress(
  storage: Pick<Storage, 'removeItem'> = localStorage,
): void {
  storage.removeItem(PROGRESS_KEY)
}

export function isLevelUnlocked(
  progress: ProgressSave,
  levelId: string,
): boolean {
  const unlockedIdx = LEVEL_ORDER.indexOf(progress.unlockedLevelId)
  const targetIdx = LEVEL_ORDER.indexOf(levelId)
  if (targetIdx < 0) return false
  if (unlockedIdx < 0) return targetIdx === 0
  return targetIdx <= unlockedIdx
}

export function applyWinProgress(
  progress: ProgressSave,
  levelId: string,
  stars: 1 | 2 | 3,
): ProgressSave {
  const next = nextUnlock(levelId)
  const prevStars = progress.stars[levelId] ?? 0
  return {
    ...progress,
    unlockedLevelId:
      next && LEVEL_ORDER.indexOf(next) > LEVEL_ORDER.indexOf(progress.unlockedLevelId)
        ? next
        : progress.unlockedLevelId,
    stars: {
      ...progress.stars,
      [levelId]: Math.max(prevStars, stars) as 0 | 1 | 2 | 3,
    },
  }
}

function nextUnlock(levelId: string): string | null {
  const i = LEVEL_ORDER.indexOf(levelId)
  if (i < 0 || i >= LEVEL_ORDER.length - 1) return levelId
  return LEVEL_ORDER[i + 1]!
}
