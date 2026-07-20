export interface SpawnEntry {
  zombie: string
  row: number
}

export interface WaveDef {
  /** seconds from level start */
  at: number
  huge?: boolean
  spawns: SpawnEntry[]
}

export interface LevelDef {
  id: string
  name: string
  chapter: 1 | 2
  initialSun: number
  naturalSun: boolean
  naturalSunIntervalMs: number
  cardSlots: number
  /** if set, skip free pick and use these plants */
  presetCards?: string[]
  freePick: boolean
  plantIds: string[]
  waves: WaveDef[]
  mowers: boolean
  /** star rules simplified: clear = 1, no mower used = +1, sun leftover >= 50 = +1 */
  description: string
}
