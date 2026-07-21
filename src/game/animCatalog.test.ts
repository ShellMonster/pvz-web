import { describe, expect, it } from 'vitest'
import { ANIM_SETS, animFramePath, clipFrameIndex } from '@/game/animCatalog'

describe('animCatalog', () => {
  it('defines sunflower idle/produce and peashooter shoot clips', () => {
    const sun = ANIM_SETS.find((s) => s.id === 'sunflower')
    const pea = ANIM_SETS.find((s) => s.id === 'peashooter')
    const zombie = ANIM_SETS.find((s) => s.id === 'normal')
    expect(sun?.clips.some((c) => c.action === 'idle' && c.frames >= 3)).toBe(true)
    expect(pea?.clips.some((c) => c.action === 'shoot' && c.frames >= 2)).toBe(true)
    expect(zombie?.clips.some((c) => c.action === 'walk' && c.frames >= 4)).toBe(true)
  })

  it('builds frame paths and frame indices', () => {
    expect(animFramePath('plants', 'sunflower', 'idle', 2)).toBe(
      '/assets/anim/plants/sunflower/idle_2.png',
    )
    const clip = { action: 'idle' as const, frames: 4, frameDuration: 0.1, loop: true }
    expect(clipFrameIndex(clip, 0)).toBe(0)
    expect(clipFrameIndex(clip, 0.25)).toBe(2)
    expect(clipFrameIndex(clip, 0.45)).toBe(0)
    const once = { action: 'shoot' as const, frames: 3, frameDuration: 0.1, loop: false }
    expect(clipFrameIndex(once, 1)).toBe(2)
  })
})
