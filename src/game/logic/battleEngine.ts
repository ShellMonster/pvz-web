import { GRID_COLS, GRID_ROWS, ZOMBIE_REACH_X, LAWN } from '@/data/balance'
import { getPlant } from '@/data/plants'
import { getZombie } from '@/data/zombies'
import type { LevelDef } from '@/types/level'
import type { PlantDef } from '@/types/plant'

export type BattleStatus = 'playing' | 'won' | 'lost'

export interface PlantEntity {
  id: string
  plantId: string
  row: number
  col: number
  hp: number
  maxHp: number
  fireCd: number
  sunCd: number
  armed: boolean
  armTimer: number
  consumable: boolean
  /** 射击后坐力动画剩余时间（秒） */
  shootAnim: number
  /** 产阳光弹跳动画剩余时间（秒） */
  produceAnim: number
  /** 种植落地动画剩余时间（秒） */
  plantAnim: number
}

export interface ZombieEntity {
  id: string
  zombieId: string
  row: number
  x: number
  hp: number
  armorHp: number
  speed: number
  baseSpeed: number
  slowTimer: number
  chewing: boolean
  flying: boolean
  rage: boolean
  summonCd: number
  /** 走路相位（累计），用于脚步循环 */
  walkPhase: number
  /** 受击闪白剩余时间 */
  hitFlash: number
}

export interface ProjectileEntity {
  id: string
  row: number
  x: number
  damage: number
  slows: boolean
  fire: boolean
  speed: number
  /** 旋转相位 */
  spin: number
}

export interface SunEntity {
  id: string
  amount: number
  x: number
  y: number
  ttl: number
  /** 出生下落动画剩余 */
  dropAnim: number
  spin: number
}

export interface BattleSnapshot {
  status: BattleStatus
  sun: number
  time: number
  plants: PlantEntity[]
  zombies: ZombieEntity[]
  projectiles: ProjectileEntity[]
  suns: SunEntity[]
  mowers: boolean[]
  mowersUsed: number
  selectedPlantId: string | null
  waveIndex: number
  totalWaves: number
  hugeWave: boolean
  toast: string | null
  loseReason: string | null
}

export interface BattleEngineOptions {
  level: LevelDef
  loadout: string[]
}

let seq = 1
const nid = (p: string) => `${p}_${seq++}`

export class BattleEngine {
  readonly level: LevelDef
  readonly loadout: string[]
  readonly cooldowns: Record<string, number> = {}

  status: BattleStatus = 'playing'
  sun: number
  time = 0
  plants: PlantEntity[] = []
  zombies: ZombieEntity[] = []
  projectiles: ProjectileEntity[] = []
  suns: SunEntity[] = []
  mowers: boolean[]
  mowersUsed = 0
  selectedPlantId: string | null = null
  waveFired: boolean[]
  hugeWave = false
  toast: string | null = null
  loseReason: string | null = null
  naturalSunCd: number
  paused = false
  speed: number = 1

  private grid: (PlantEntity | null)[][]

  constructor(opts: BattleEngineOptions) {
    this.level = opts.level
    this.loadout = opts.loadout
    this.sun = opts.level.initialSun
    this.mowers = Array.from({ length: GRID_ROWS }, () => opts.level.mowers)
    this.waveFired = opts.level.waves.map(() => false)
    this.naturalSunCd = opts.level.naturalSun
      ? opts.level.naturalSunIntervalMs / 1000
      : Infinity
    this.grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => null),
    )
    for (const id of this.loadout) this.cooldowns[id] = 0
  }

  snapshot(): BattleSnapshot {
    return {
      status: this.status,
      sun: this.sun,
      time: this.time,
      plants: this.plants.map((p) => ({ ...p })),
      zombies: this.zombies.map((z) => ({ ...z })),
      projectiles: this.projectiles.map((p) => ({ ...p })),
      suns: this.suns.map((s) => ({ ...s })),
      mowers: [...this.mowers],
      mowersUsed: this.mowersUsed,
      selectedPlantId: this.selectedPlantId,
      waveIndex: this.waveFired.filter(Boolean).length,
      totalWaves: this.level.waves.length,
      hugeWave: this.hugeWave,
      toast: this.toast,
      loseReason: this.loseReason,
    }
  }

  selectPlant(plantId: string | null) {
    if (plantId && !this.loadout.includes(plantId)) return false
    this.selectedPlantId = plantId
    return true
  }

  canPlant(plantId: string, row: number, col: number): string | null {
    if (this.status !== 'playing') return '对局已结束'
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return '格子无效'
    const def = getPlant(plantId)
    if (this.sun < def.sunCost) return '阳光不足'
    if ((this.cooldowns[plantId] ?? 0) > 0) return '冷却中'
    if (this.grid[row]![col]) return '已有植物'
    return null
  }

  plantAt(row: number, col: number): boolean {
    const plantId = this.selectedPlantId
    if (!plantId) {
      this.toast = '请先选择植物'
      return false
    }
    const err = this.canPlant(plantId, row, col)
    if (err) {
      this.toast = err
      return false
    }
    const def = getPlant(plantId)
    this.sun -= def.sunCost
    this.cooldowns[plantId] = def.cooldownMs / 1000
    const entity: PlantEntity = {
      id: nid('p'),
      plantId,
      row,
      col,
      hp: def.maxHp,
      maxHp: def.maxHp,
      fireCd: 0.3,
      sunCd: def.behavior === 'sun_producer' ? 2 : 0,
      armed: def.behavior !== 'potato_mine',
      armTimer: def.behavior === 'potato_mine' ? 14 : 0,
      consumable:
        def.behavior === 'instant_aoe' || def.behavior === 'row_burn',
      shootAnim: 0,
      produceAnim: 0,
      plantAnim: 0.35,
    }
    this.plants.push(entity)
    this.grid[row]![col] = entity
    this.selectedPlantId = null
    this.toast = null

    if (def.behavior === 'instant_aoe') {
      this.explodeAoe(row, col, def)
      this.removePlant(entity)
    } else if (def.behavior === 'row_burn') {
      this.burnRow(row, def.damage)
      this.removePlant(entity)
    }
    return true
  }

  collectSun(id: string): boolean {
    const i = this.suns.findIndex((s) => s.id === id)
    if (i < 0) return false
    const [sun] = this.suns.splice(i, 1)
    if (!sun) return false
    this.sun += sun.amount
    return true
  }

  collectAllSun() {
    for (const s of this.suns) this.sun += s.amount
    this.suns = []
  }

  setPaused(p: boolean) {
    this.paused = p
  }

  setSpeed(rate: number) {
    this.speed = rate
  }

  tick(dtRaw: number) {
    if (this.status !== 'playing' || this.paused) return
    const dt = dtRaw * this.speed
    this.time += dt
    this.toast = null
    this.hugeWave = false

    for (const id of Object.keys(this.cooldowns)) {
      this.cooldowns[id] = Math.max(0, (this.cooldowns[id] ?? 0) - dt)
    }

    this.spawnWaves()
    this.tickNaturalSun(dt)
    this.tickPlants(dt)
    this.tickProjectiles(dt)
    this.tickZombies(dt)
    this.tickSuns(dt)
    this.checkEnd()
  }

  private spawnWaves() {
    this.level.waves.forEach((wave, i) => {
      if (this.waveFired[i]) return
      if (this.time < wave.at) return
      this.waveFired[i] = true
      if (wave.huge) {
        this.hugeWave = true
        this.toast = '一大波僵尸正在接近！'
      }
      for (const s of wave.spawns) this.spawnZombie(s.zombie, s.row)
    })
  }

  /** Spawn helper used by waves and tests. */
  spawnZombie(zombieId: string, row: number) {
    const def = getZombie(zombieId)
    const z: ZombieEntity = {
      id: nid('z'),
      zombieId,
      row: Math.max(0, Math.min(GRID_ROWS - 1, row)),
      x: LAWN.originX + GRID_COLS * LAWN.cellW + 40,
      hp: def.maxHp,
      armorHp: def.armorHp,
      speed: def.speed,
      baseSpeed: def.speed,
      slowTimer: 0,
      chewing: false,
      flying: def.behavior === 'balloon',
      rage: false,
      summonCd: def.behavior === 'dancer' ? 8 : 0,
      walkPhase: Math.random() * Math.PI * 2,
      hitFlash: 0,
    }
    this.zombies.push(z)
  }

  private tickNaturalSun(dt: number) {
    if (!this.level.naturalSun) return
    this.naturalSunCd -= dt
    if (this.naturalSunCd <= 0) {
      this.naturalSunCd = this.level.naturalSunIntervalMs / 1000
      this.dropSun(25, LAWN.originX + 200 + Math.random() * 400, 40)
    }
  }

  private dropSun(amount: number, x: number, y: number) {
    this.suns.push({
      id: nid('s'),
      amount,
      x,
      y,
      ttl: 12,
      dropAnim: 0.45,
      spin: Math.random() * Math.PI * 2,
    })
  }

  private tickPlants(dt: number) {
    for (const p of [...this.plants]) {
      const def = getPlant(p.plantId)
      p.shootAnim = Math.max(0, p.shootAnim - dt)
      p.produceAnim = Math.max(0, p.produceAnim - dt)
      p.plantAnim = Math.max(0, p.plantAnim - dt)
      if (def.behavior === 'potato_mine' && !p.armed) {
        p.armTimer -= dt
        if (p.armTimer <= 0) p.armed = true
      }
      if (def.behavior === 'sun_producer') {
        p.sunCd -= dt
        if (p.sunCd <= 0) {
          p.sunCd = def.sunIntervalMs / 1000
          p.produceAnim = 0.45
          const pos = cellCenter(p.row, p.col)
          this.dropSun(def.sunProduce, pos.x, pos.y - 20)
        }
      }
      if (def.behavior === 'shooter') {
        const target = this.frontZombie(p.row, p.col)
        if (target) {
          p.fireCd -= dt
          if (p.fireCd <= 0) {
            p.fireCd = def.fireIntervalMs / 1000
            p.shootAnim = 0.28
            const shots = p.plantId === 'repeater' ? 2 : 1
            const origin = cellCenter(p.row, p.col)
            for (let i = 0; i < shots; i++) {
              this.projectiles.push({
                id: nid('b'),
                row: p.row,
                x: origin.x + 20 + i * 12,
                damage: def.damage,
                slows: def.slows,
                fire: false,
                speed: 320,
                spin: 0,
              })
            }
          }
        } else {
          p.fireCd = Math.min(p.fireCd, 0.2)
        }
      }
      if (def.behavior === 'spike') {
        p.fireCd -= dt
        if (p.fireCd <= 0) {
          p.fireCd = def.fireIntervalMs / 1000
          for (const z of this.zombies) {
            if (z.row !== p.row || z.flying) continue
            if (this.zombieOnCell(z, p.col)) this.damageZombie(z, def.damage, false)
          }
        }
      }
    }
  }

  private tickProjectiles(dt: number) {
    for (const b of [...this.projectiles]) {
      b.x += b.speed * dt
      b.spin += dt * 14
      // torch upgrade
      for (const p of this.plants) {
        if (getPlant(p.plantId).behavior !== 'torch') continue
        if (p.row !== b.row) continue
        const cx = cellCenter(p.row, p.col).x
        if (Math.abs(b.x - cx) < 20 && !b.fire) {
          b.fire = true
          b.damage = Math.round(b.damage * 2)
        }
      }
      const hit = this.zombies.find(
        (z) => z.row === b.row && !z.flying && z.x <= b.x + 10 && z.x >= b.x - 30,
      )
      if (hit) {
        this.damageZombie(hit, b.damage, b.slows)
        this.projectiles = this.projectiles.filter((p) => p.id !== b.id)
        continue
      }
      if (b.x > LAWN.originX + GRID_COLS * LAWN.cellW + 80) {
        this.projectiles = this.projectiles.filter((p) => p.id !== b.id)
      }
    }
  }

  private tickZombies(dt: number) {
    for (const z of [...this.zombies]) {
      z.hitFlash = Math.max(0, z.hitFlash - dt)
      if (z.slowTimer > 0) {
        z.slowTimer -= dt
        z.speed = z.baseSpeed * 0.5
      } else {
        z.speed = z.rage ? z.baseSpeed * 1.7 : z.baseSpeed
      }

      const def = getZombie(z.zombieId)
      if (def.behavior === 'dancer') {
        z.summonCd -= dt
        if (z.summonCd <= 0) {
          z.summonCd = 12
          this.spawnZombie('normal', z.row)
        }
      }

      // potato mine
      for (const p of this.plants) {
        if (getPlant(p.plantId).behavior !== 'potato_mine' || !p.armed) continue
        if (p.row === z.row && this.zombieOnCell(z, p.col) && !z.flying) {
          this.damageZombie(z, getPlant(p.plantId).damage, false)
          this.removePlant(p)
        }
      }

      // gargantuar smash when near plant
      const blocker = this.plantInFront(z)
      if (blocker && !z.flying) {
        z.chewing = true
        // 啃食时也有小幅度点头相位
        z.walkPhase += dt * 8
        if (def.behavior === 'gargantuar') {
          this.removePlant(blocker)
          z.chewing = false
        } else {
          blocker.hp -= def.chewDps * dt
          if (blocker.hp <= 0) this.removePlant(blocker)
        }
      } else {
        z.chewing = false
        const moved = z.speed * dt
        z.x -= moved
        // 走路相位与移动距离挂钩，停住就停步
        z.walkPhase += (moved / 18) * Math.PI
      }

      if (z.x <= ZOMBIE_REACH_X) {
        if (this.mowers[z.row]) {
          this.mowers[z.row] = false
          this.mowersUsed += 1
          this.zombies = this.zombies.filter((o) => o.row !== z.row)
          this.toast = '小推车出动！'
        } else {
          this.status = 'lost'
          this.loseReason = '僵尸破防了'
          return
        }
      }
    }
  }

  private tickSuns(dt: number) {
    for (const s of this.suns) {
      s.ttl -= dt
      s.dropAnim = Math.max(0, s.dropAnim - dt)
      s.spin += dt * 3
    }
    this.suns = this.suns.filter((s) => s.ttl > 0)
  }

  checkEnd() {
    if (this.status !== 'playing') return
    const allWaves = this.waveFired.every(Boolean)
    if (allWaves && this.zombies.length === 0) {
      this.status = 'won'
    }
  }

  private frontZombie(row: number, col: number): ZombieEntity | undefined {
    const minX = cellCenter(row, col).x
    return this.zombies
      .filter((z) => z.row === row && z.x >= minX && !z.flying)
      .sort((a, b) => a.x - b.x)[0]
  }

  private plantInFront(z: ZombieEntity): PlantEntity | null {
    // find rightmost plant on row whose cell center is near zombie
    let best: PlantEntity | null = null
    for (const p of this.plants) {
      if (p.row !== z.row) continue
      if (getPlant(p.plantId).behavior === 'spike') continue
      const cx = cellCenter(p.row, p.col).x
      if (z.x <= cx + LAWN.cellW * 0.45 && z.x >= cx - LAWN.cellW * 0.2) {
        if (!best || p.col > best.col) best = p
      }
    }
    return best
  }

  private zombieOnCell(z: ZombieEntity, col: number): boolean {
    const cx = cellCenter(z.row, col).x
    return Math.abs(z.x - cx) < LAWN.cellW * 0.45
  }

  private damageZombie(z: ZombieEntity, dmg: number, slows: boolean) {
    z.hitFlash = 0.12
    if (z.armorHp > 0) {
      z.armorHp -= dmg
      if (z.armorHp < 0) {
        z.hp += z.armorHp
        z.armorHp = 0
      }
    } else {
      z.hp -= dmg
    }
    if (slows) z.slowTimer = 3
    const def = getZombie(z.zombieId)
    if (def.behavior === 'newspaper' && z.armorHp <= 0 && !z.rage) {
      z.rage = true
      z.baseSpeed *= 1.8
    }
    if (z.hp <= 0) {
      this.zombies = this.zombies.filter((o) => o.id !== z.id)
    }
  }

  private explodeAoe(row: number, col: number, def: PlantDef) {
    for (const z of [...this.zombies]) {
      const zcol = Math.floor((z.x - LAWN.originX) / LAWN.cellW)
      if (Math.abs(z.row - row) <= def.aoeRadius && Math.abs(zcol - col) <= def.aoeRadius) {
        this.damageZombie(z, def.damage, false)
      }
    }
  }

  private burnRow(row: number, damage: number) {
    for (const z of [...this.zombies]) {
      if (z.row === row) this.damageZombie(z, damage, false)
    }
  }

  private removePlant(p: PlantEntity) {
    this.plants = this.plants.filter((o) => o.id !== p.id)
    if (this.grid[p.row]?.[p.col]?.id === p.id) this.grid[p.row]![p.col] = null
  }
}

export function cellCenter(row: number, col: number) {
  return {
    x: LAWN.originX + col * LAWN.cellW + LAWN.cellW / 2,
    y: LAWN.originY + row * LAWN.cellH + LAWN.cellH / 2,
  }
}

export function calcStars(snap: BattleSnapshot, leftoverSun: number): 1 | 2 | 3 {
  let stars: 1 | 2 | 3 = 1
  if (snap.mowersUsed === 0) stars = (stars + 1) as 1 | 2 | 3
  if (leftoverSun >= 50) stars = Math.min(3, stars + 1) as 1 | 2 | 3
  return stars
}
