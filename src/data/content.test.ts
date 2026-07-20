import { describe, expect, it } from 'vitest'
import { PLANT_IDS, getPlant } from '@/data/plants'
import { ZOMBIE_IDS, getZombie } from '@/data/zombies'
import { LEVELS, getLevel, LEVEL_ORDER } from '@/data/levels'
import { GRID_COLS, GRID_ROWS } from '@/data/balance'

describe('content inventory', () => {
  it('ships ≥12 plants, ≥8 zombies, 12 levels', () => {
    expect(PLANT_IDS.length).toBeGreaterThanOrEqual(12)
    expect(ZOMBIE_IDS.length).toBeGreaterThanOrEqual(8)
    expect(LEVELS.length).toBe(12)
    expect(LEVEL_ORDER).toHaveLength(12)
    expect(GRID_ROWS).toBe(5)
    expect(GRID_COLS).toBe(9)
  })

  it('plant and zombie defs are queryable by id', () => {
    expect(getPlant('peashooter').sunCost).toBe(100)
    expect(getZombie('bucket').armorHp).toBeGreaterThan(0)
    expect(getLevel('1-1').waves.length).toBeGreaterThan(0)
    expect(getLevel('2-4').waves.some((w) => w.spawns.some((s) => s.zombie === 'gargantuar'))).toBe(
      true,
    )
  })

  it('covers plant roles and zombie threats', () => {
    const roles = new Set(PLANT_IDS.map((id) => getPlant(id).role))
    for (const r of ['economy', 'output', 'tank', 'control', 'burst', 'trap', 'support'] as const) {
      expect(roles.has(r)).toBe(true)
    }
    expect(ZOMBIE_IDS).toContain('football')
    expect(ZOMBIE_IDS).toContain('gargantuar')
  })
})
