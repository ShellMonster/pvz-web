export type ZombieBehavior =
  | 'normal'
  | 'armored'
  | 'newspaper'
  | 'screen_door'
  | 'football'
  | 'dancer'
  | 'balloon'
  | 'gargantuar'

export interface ZombieDef {
  id: string
  name: string
  maxHp: number
  /** armor HP on top of body (cone/bucket/door) */
  armorHp: number
  speed: number
  chewDps: number
  threat: number
  behavior: ZombieBehavior
  description: string
  sprite: string
}
