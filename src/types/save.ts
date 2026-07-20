export interface SettingsSave {
  bgm: number
  sfx: number
  reduceParticles: boolean
  gameSpeed: 1 | 1.5 | 2
}

export interface ProgressSave {
  version: 1
  unlockedLevelId: string
  stars: Record<string, 0 | 1 | 2 | 3>
  seenCodex: { plants: string[]; zombies: string[] }
  settings: SettingsSave
}
