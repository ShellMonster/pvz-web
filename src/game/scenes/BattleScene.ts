import Phaser from 'phaser'
import { GRID_COLS, GRID_ROWS, LAWN } from '@/data/balance'
import type { BattleEngine } from '@/game/logic/battleEngine'
import { getPlant } from '@/data/plants'
import { getZombie } from '@/data/zombies'

/** Color placeholders when sprites missing (transparent art optional). */
const PLANT_COLORS: Record<string, number> = {
  sunflower: 0xf4d03f,
  peashooter: 0x58d68d,
  wallnut: 0xc4a35a,
  snowpea: 0x5dade2,
  cherrybomb: 0xe74c3c,
  potatomine: 0xa04000,
  repeater: 0x27ae60,
  tallnut: 0x8d6e63,
  jalapeno: 0xe67e22,
  spikeweed: 0x7d3c98,
  torchwood: 0xd35400,
  sunflower_twin: 0xf7dc6f,
}

const ZOMBIE_COLORS: Record<string, number> = {
  normal: 0x7f8c8d,
  flag: 0xc0392b,
  cone: 0xe67e22,
  bucket: 0x95a5a6,
  newspaper: 0x2c3e50,
  screendoor: 0x34495e,
  football: 0x1a5276,
  dancer: 0x8e44ad,
  balloon: 0x5dade2,
  gargantuar: 0x4a235a,
}

export class BattleScene extends Phaser.Scene {
  private engine: BattleEngine
  private onSnapshot?: () => void
  private plantGfx = new Map<string, Phaser.GameObjects.Rectangle>()
  private zombieGfx = new Map<string, Phaser.GameObjects.Rectangle>()
  private bulletGfx = new Map<string, Phaser.GameObjects.Rectangle>()
  private sunGfx = new Map<string, Phaser.GameObjects.Arc>()
  private gridGfx?: Phaser.GameObjects.Graphics

  constructor(engine: BattleEngine, onSnapshot?: () => void) {
    super('battle')
    this.engine = engine
    this.onSnapshot = onSnapshot
  }

  create() {
    this.drawLawn()
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 40) return
      // sun collect
      for (const s of this.engine.snapshot().suns) {
        const dx = pointer.x - s.x
        const dy = pointer.y - s.y
        if (dx * dx + dy * dy < 28 * 28) {
          this.engine.collectSun(s.id)
          this.onSnapshot?.()
          return
        }
      }
      const col = Math.floor((pointer.x - LAWN.originX) / LAWN.cellW)
      const row = Math.floor((pointer.y - LAWN.originY) / LAWN.cellH)
      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        this.engine.plantAt(row, col)
        this.onSnapshot?.()
      }
    })
  }

  update(_: number, delta: number) {
    this.engine.tick(delta / 1000)
    this.syncGfx()
    this.onSnapshot?.()
  }

  private drawLawn() {
    this.add.rectangle(640, 360, 1280, 720, 0x1a3d1a).setDepth(-2)
    this.add.rectangle(70, 360, 100, 720, 0x5d4037).setDepth(-1)
    this.gridGfx = this.add.graphics().setDepth(0)
    this.gridGfx.lineStyle(1, 0x2e7d32, 0.6)
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = LAWN.originX + c * LAWN.cellW
        const y = LAWN.originY + r * LAWN.cellH
        this.gridGfx.strokeRect(x, y, LAWN.cellW, LAWN.cellH)
        const shade = (r + c) % 2 === 0 ? 0x2e7d32 : 0x388e3c
        this.add
          .rectangle(
            x + LAWN.cellW / 2,
            y + LAWN.cellH / 2,
            LAWN.cellW - 2,
            LAWN.cellH - 2,
            shade,
            0.35,
          )
          .setDepth(-1)
      }
    }
  }

  private syncGfx() {
    const snap = this.engine.snapshot()
    const liveP = new Set(snap.plants.map((p) => p.id))
    for (const [id, g] of this.plantGfx) {
      if (!liveP.has(id)) {
        g.destroy()
        this.plantGfx.delete(id)
      }
    }
    for (const p of snap.plants) {
      let g = this.plantGfx.get(p.id)
      const x = LAWN.originX + p.col * LAWN.cellW + LAWN.cellW / 2
      const y = LAWN.originY + p.row * LAWN.cellH + LAWN.cellH / 2
      const color = PLANT_COLORS[p.plantId] ?? 0x66bb6a
      if (!g) {
        g = this.add.rectangle(x, y, 54, 64, color).setDepth(2)
        this.plantGfx.set(p.id, g)
      } else {
        g.setPosition(x, y)
      }
      g.setAlpha(getPlant(p.plantId).behavior === 'potato_mine' && !p.armed ? 0.5 : 1)
    }

    const liveZ = new Set(snap.zombies.map((z) => z.id))
    for (const [id, g] of this.zombieGfx) {
      if (!liveZ.has(id)) {
        g.destroy()
        this.zombieGfx.delete(id)
      }
    }
    for (const z of snap.zombies) {
      let g = this.zombieGfx.get(z.id)
      const y = LAWN.originY + z.row * LAWN.cellH + LAWN.cellH / 2
      const color = ZOMBIE_COLORS[z.zombieId] ?? 0x90a4ae
      const h = getZombie(z.zombieId).behavior === 'gargantuar' ? 90 : 70
      if (!g) {
        g = this.add.rectangle(z.x, y, 40, h, color).setDepth(3)
        this.zombieGfx.set(z.id, g)
      } else {
        g.setPosition(z.x, y)
      }
      g.setAlpha(z.flying ? 0.7 : 1)
    }

    const liveB = new Set(snap.projectiles.map((b) => b.id))
    for (const [id, g] of this.bulletGfx) {
      if (!liveB.has(id)) {
        g.destroy()
        this.bulletGfx.delete(id)
      }
    }
    for (const b of snap.projectiles) {
      let g = this.bulletGfx.get(b.id)
      const y = LAWN.originY + b.row * LAWN.cellH + LAWN.cellH / 2
      const color = b.fire ? 0xff5722 : b.slows ? 0x4fc3f7 : 0x8bc34a
      if (!g) {
        g = this.add.rectangle(b.x, y, 14, 10, color).setDepth(4)
        this.bulletGfx.set(b.id, g)
      } else g.setPosition(b.x, y)
    }

    const liveS = new Set(snap.suns.map((s) => s.id))
    for (const [id, g] of this.sunGfx) {
      if (!liveS.has(id)) {
        g.destroy()
        this.sunGfx.delete(id)
      }
    }
    for (const s of snap.suns) {
      let g = this.sunGfx.get(s.id)
      if (!g) {
        g = this.add.circle(s.x, s.y, 16, 0xffeb3b).setDepth(5).setInteractive()
        this.sunGfx.set(s.id, g)
      } else g.setPosition(s.x, s.y)
    }

    // mowers
    for (let r = 0; r < GRID_ROWS; r++) {
      // drawn each frame as cheap markers
    }
  }
}
