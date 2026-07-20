import { describe, expect, it } from 'vitest'
import { getLevel } from '@/data/levels'
import { BattleEngine, calcStars } from '@/game/logic/battleEngine'
import { GRID_COLS, GRID_ROWS } from '@/data/balance'

function makeEngine(levelId = '1-1', loadout = ['sunflower', 'peashooter']) {
  return new BattleEngine({ level: getLevel(levelId), loadout })
}

describe('BattleEngine grid & economy', () => {
  it('uses 5×9 lawn and blocks plant when sun insufficient', () => {
    const eng = makeEngine()
    expect(GRID_ROWS).toBe(5)
    expect(GRID_COLS).toBe(9)
    eng.sun = 0
    eng.selectPlant('peashooter')
    expect(eng.canPlant('peashooter', 0, 0)).toBe('阳光不足')
    expect(eng.plantAt(0, 0)).toBe(false)
  })

  it('plants occupy a cell and spend sun', () => {
    const eng = makeEngine()
    eng.sun = 200
    eng.selectPlant('sunflower')
    expect(eng.plantAt(1, 1)).toBe(true)
    expect(eng.sun).toBe(150)
    eng.selectPlant('peashooter')
    expect(eng.canPlant('peashooter', 1, 1)).toBe('已有植物')
    const snap = eng.snapshot()
    expect(snap.plants).toHaveLength(1)
    expect(snap.plants[0]!.plantId).toBe('sunflower')
  })
})

describe('BattleEngine combat', () => {
  it('projectiles damage zombies over time', () => {
    const eng = makeEngine()
    eng.sun = 500
    eng.selectPlant('peashooter')
    eng.plantAt(2, 0)
    // spawn a zombie on same row close enough
    eng.spawnZombie('normal', 2)
    const z = eng.zombies[0]!
    z.x = 400
    const hp0 = z.hp + z.armorHp
    // run enough time for shots
    for (let i = 0; i < 200; i++) eng.tick(0.1)
    const alive = eng.zombies[0]
    const hp1 = alive ? alive.hp + alive.armorHp : 0
    expect(hp1).toBeLessThan(hp0)
  })

  it('zombie reaching left without mower loses', () => {
    const eng = makeEngine()
    eng.mowers = eng.mowers.map(() => false)
    eng.spawnZombie('normal', 0)
    eng.zombies[0]!.x = 100
    eng.tick(0.05)
    expect(eng.status).toBe('lost')
  })

  it('mower clears row instead of losing', () => {
    const eng = makeEngine()
    eng.mowers = eng.mowers.map(() => true)
    eng.spawnZombie('normal', 1)
    eng.zombies[0]!.x = 100
    eng.tick(0.05)
    expect(eng.status).toBe('playing')
    expect(eng.mowers[1]).toBe(false)
    expect(eng.zombies.filter((z) => z.row === 1)).toHaveLength(0)
  })

  it('clearing all waves and zombies wins', () => {
    const eng = makeEngine()
    eng.waveFired = eng.waveFired.map(() => true)
    eng.zombies = []
    eng.checkEnd()
    expect(eng.status).toBe('won')
    expect(calcStars(eng.snapshot(), 80)).toBeGreaterThanOrEqual(1)
  })
})

describe('BattleEngine waves', () => {
  it('spawns from level wave table by time', () => {
    const eng = makeEngine('1-1')
    expect(eng.zombies).toHaveLength(0)
    eng.tick(13)
    expect(eng.zombies.length).toBeGreaterThan(0)
  })
})
