export type PlantRole =
  | 'economy'
  | 'output'
  | 'tank'
  | 'control'
  | 'burst'
  | 'trap'
  | 'support'
  | 'ground'

export type PlantBehavior =
  | 'sun_producer'
  | 'shooter'
  | 'wall'
  | 'instant_aoe'
  | 'potato_mine'
  | 'row_burn'
  | 'spike'
  | 'torch'

export interface PlantDef {
  id: string
  name: string
  sunCost: number
  cooldownMs: number
  maxHp: number
  role: PlantRole
  behavior: PlantBehavior
  /** damage per shot or instant */
  damage: number
  /** ms between shots for shooters */
  fireIntervalMs: number
  /** sun produced per pulse */
  sunProduce: number
  sunIntervalMs: number
  /** aoe radius in tiles for cherry etc */
  aoeRadius: number
  slows: boolean
  description: string
  /** asset path under public/assets/plants */
  sprite: string
}
