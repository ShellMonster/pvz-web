/**
 * 帧动画目录约定：
 * public/assets/anim/<kind>/<id>/<action>_<frame>.png
 * 例：anim/plants/sunflower/idle_0.png
 */

export type AnimAction = 'idle' | 'shoot' | 'walk' | 'chew' | 'spin' | 'produce'

export interface AnimClipDef {
  action: AnimAction
  frames: number
  /** 每帧秒数 */
  frameDuration: number
  loop: boolean
}

export interface CharacterAnimSet {
  kind: 'plants' | 'zombies' | 'ui'
  id: string
  clips: AnimClipDef[]
  /** 中文描述，用于生图 */
  label: string
  basePrompt: string
}

/** 优先生成、对可玩性最关键的角色动画 */
export const ANIM_SETS: CharacterAnimSet[] = [
  {
    kind: 'plants',
    id: 'sunflower',
    label: '阳光花',
    basePrompt: 'cheerful cartoon sunflower plant with face, green stem and leaves',
    clips: [
      { action: 'idle', frames: 4, frameDuration: 0.18, loop: true },
      { action: 'produce', frames: 3, frameDuration: 0.12, loop: false },
    ],
  },
  {
    kind: 'plants',
    id: 'sunflower_twin',
    label: '双胞花',
    basePrompt: 'twin double sunflower plant with two flower heads, cartoon',
    clips: [
      { action: 'idle', frames: 4, frameDuration: 0.18, loop: true },
      { action: 'produce', frames: 3, frameDuration: 0.12, loop: false },
    ],
  },
  {
    kind: 'plants',
    id: 'peashooter',
    label: '射手豆',
    basePrompt: 'green peashooter plant with open mouth cannon facing right, cartoon',
    clips: [
      { action: 'idle', frames: 3, frameDuration: 0.2, loop: true },
      { action: 'shoot', frames: 3, frameDuration: 0.07, loop: false },
    ],
  },
  {
    kind: 'plants',
    id: 'snowpea',
    label: '冰霜豆',
    basePrompt: 'icy blue peashooter plant facing right, frost crystals, cartoon',
    clips: [
      { action: 'idle', frames: 3, frameDuration: 0.2, loop: true },
      { action: 'shoot', frames: 3, frameDuration: 0.07, loop: false },
    ],
  },
  {
    kind: 'plants',
    id: 'repeater',
    label: '双射豆',
    basePrompt: 'double-headed green peashooter plant facing right, cartoon',
    clips: [
      { action: 'idle', frames: 3, frameDuration: 0.2, loop: true },
      { action: 'shoot', frames: 3, frameDuration: 0.06, loop: false },
    ],
  },
  {
    kind: 'plants',
    id: 'wallnut',
    label: '硬壳果',
    basePrompt: 'brown tough walnut plant wall with determined face, cartoon',
    clips: [{ action: 'idle', frames: 3, frameDuration: 0.28, loop: true }],
  },
  {
    kind: 'plants',
    id: 'tallnut',
    label: '高坚果',
    basePrompt: 'very tall brown nut wall plant, towering face, cartoon',
    clips: [{ action: 'idle', frames: 3, frameDuration: 0.28, loop: true }],
  },
  {
    kind: 'plants',
    id: 'torchwood',
    label: '火炬木',
    basePrompt: 'wooden torch stump plant with bright flame on top, cartoon',
    clips: [{ action: 'idle', frames: 4, frameDuration: 0.12, loop: true }],
  },
  {
    kind: 'plants',
    id: 'potatomine',
    label: '地刺薯',
    basePrompt: 'potato mine plant with spiky top, cartoon',
    clips: [{ action: 'idle', frames: 3, frameDuration: 0.22, loop: true }],
  },
  // zombies walk cycles
  ...(
    [
      ['normal', '经典绿色僵尸，蓝衣服'],
      ['flag', '举小红旗的僵尸'],
      ['cone', '头顶路障锥的僵尸'],
      ['bucket', '头顶铁桶的僵尸'],
      ['newspaper', '拿报纸的僵尸'],
      ['screendoor', '拿纱门盾的僵尸'],
      ['football', '橄榄球盔甲僵尸'],
      ['dancer', '迪斯科舞王僵尸'],
      ['balloon', '抓气球漂浮的僵尸'],
      ['gargantuar', '巨大巨人僵尸首领'],
    ] as const
  ).map(([id, label]) => ({
    kind: 'zombies' as const,
    id,
    label,
    basePrompt: `cartoon zombie ${id}, ${label}, full body, facing left, Plants vs Zombies fan style`,
    clips: [
      { action: 'walk' as const, frames: 4, frameDuration: 0.14, loop: true },
      { action: 'chew' as const, frames: 3, frameDuration: 0.12, loop: true },
    ],
  })),
  {
    kind: 'ui',
    id: 'sun',
    label: '阳光',
    basePrompt: 'golden smiling sun coin collectible icon, circular',
    clips: [{ action: 'spin', frames: 4, frameDuration: 0.12, loop: true }],
  },
]

export function animFramePath(
  kind: string,
  id: string,
  action: string,
  frame: number,
): string {
  return `/assets/anim/${kind}/${id}/${action}_${frame}.png`
}

export function clipFrameIndex(
  clip: AnimClipDef,
  elapsed: number,
): number {
  if (clip.frames <= 0) return 0
  if (clip.loop) {
    const t = elapsed / clip.frameDuration
    return Math.floor(t) % clip.frames
  }
  const t = elapsed / clip.frameDuration
  return Math.min(clip.frames - 1, Math.floor(t))
}
