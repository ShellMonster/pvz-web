import { GRID_COLS, GRID_ROWS, LAWN, DESIGN_HEIGHT, DESIGN_WIDTH } from '@/data/balance'
import type { BattleEngine } from '@/game/logic/battleEngine'
import { getPlant } from '@/data/plants'
import { getZombie } from '@/data/zombies'

export type AssetMap = {
  plants: Record<string, HTMLImageElement | null>
  zombies: Record<string, HTMLImageElement | null>
  sun: HTMLImageElement | null
  pea: HTMLImageElement | null
  snowPea: HTMLImageElement | null
  firePea: HTMLImageElement | null
  mower: HTMLImageElement | null
  lawn: HTMLImageElement | null
  house: HTMLImageElement | null
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function loadAssets(): Promise<AssetMap> {
  const plantIds = [
    'sunflower',
    'peashooter',
    'wallnut',
    'snowpea',
    'cherrybomb',
    'potatomine',
    'repeater',
    'tallnut',
    'jalapeno',
    'spikeweed',
    'torchwood',
    'sunflower_twin',
  ]
  const zombieIds = [
    'normal',
    'flag',
    'cone',
    'bucket',
    'newspaper',
    'screendoor',
    'football',
    'dancer',
    'balloon',
    'gargantuar',
  ]
  const plants: AssetMap['plants'] = {}
  const zombies: AssetMap['zombies'] = {}
  await Promise.all([
    ...plantIds.map(async (id) => {
      plants[id] = await loadImage(`/assets/plants/${id}.png`)
    }),
    ...zombieIds.map(async (id) => {
      zombies[id] = await loadImage(`/assets/zombies/${id}.png`)
    }),
  ])
  return {
    plants,
    zombies,
    sun: await loadImage('/assets/ui/sun.png'),
    pea: await loadImage('/assets/effects/pea.png'),
    snowPea: await loadImage('/assets/effects/snow-pea.png'),
    firePea: await loadImage('/assets/effects/fire-pea.png'),
    mower: await loadImage('/assets/ui/mower.png'),
    lawn: await loadImage('/assets/backgrounds/lawn-day.png'),
    house: await loadImage('/assets/backgrounds/house.png'),
  }
}

const PLANT_FALLBACK: Record<string, string> = {
  sunflower: '#f4d03f',
  peashooter: '#58d68d',
  wallnut: '#c4a35a',
  snowpea: '#5dade2',
  cherrybomb: '#e74c3c',
  potatomine: '#a04000',
  repeater: '#27ae60',
  tallnut: '#8d6e63',
  jalapeno: '#e67e22',
  spikeweed: '#7d3c98',
  torchwood: '#d35400',
  sunflower_twin: '#f7dc6f',
}

const ZOMBIE_FALLBACK: Record<string, string> = {
  normal: '#7f8c8d',
  flag: '#c0392b',
  cone: '#e67e22',
  bucket: '#95a5a6',
  newspaper: '#2c3e50',
  screendoor: '#34495e',
  football: '#1a5276',
  dancer: '#8e44ad',
  balloon: '#5dade2',
  gargantuar: '#4a235a',
}

export interface CanvasBattleHandle {
  destroy: () => void
}

/**
 * Pure Canvas2D battle view — no React DOM children inside the canvas host.
 * Avoids Phaser/React removeChild conflicts.
 */
export function startCanvasBattle(opts: {
  canvas: HTMLCanvasElement
  engine: BattleEngine
  assets: AssetMap
  onUi: () => void
}): CanvasBattleHandle {
  const { canvas, engine, assets, onUi } = opts
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  canvas.width = DESIGN_WIDTH
  canvas.height = DESIGN_HEIGHT

  let raf = 0
  let last = performance.now()
  let destroyed = false
  let uiAcc = 0

  const onClick = (ev: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const x = (ev.clientX - rect.left) * sx
    const y = (ev.clientY - rect.top) * sy

    for (const s of engine.snapshot().suns) {
      const dx = x - s.x
      const dy = y - s.y
      if (dx * dx + dy * dy < 30 * 30) {
        engine.collectSun(s.id)
        onUi()
        return
      }
    }
    const col = Math.floor((x - LAWN.originX) / LAWN.cellW)
    const row = Math.floor((y - LAWN.originY) / LAWN.cellH)
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      engine.plantAt(row, col)
      onUi()
    }
  }
  canvas.addEventListener('click', onClick)

  const drawImage = (
    img: HTMLImageElement | null | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    fallback: string,
  ) => {
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x - w / 2, y - h / 2, w, h)
    } else {
      ctx.fillStyle = fallback
      ctx.beginPath()
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 8)
      ctx.fill()
    }
  }

  const paint = () => {
    const snap = engine.snapshot()

    // background
    if (assets.lawn && assets.lawn.naturalWidth) {
      ctx.drawImage(assets.lawn, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT)
      g.addColorStop(0, '#87ceeb')
      g.addColorStop(0.35, '#7ec850')
      g.addColorStop(1, '#3d8b37')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
    }

    // house strip
    if (assets.house && assets.house.naturalWidth) {
      ctx.drawImage(assets.house, 0, 60, 160, 600)
    } else {
      ctx.fillStyle = '#8b5a2b'
      ctx.fillRect(0, 80, 150, 560)
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(20, 120, 80, 60)
      ctx.fillStyle = '#f5deb3'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('房子', 40, 155)
    }

    // lawn cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = LAWN.originX + c * LAWN.cellW
        const y = LAWN.originY + r * LAWN.cellH
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(60,140,50,0.55)' : 'rgba(80,160,60,0.45)'
        ctx.fillRect(x + 1, y + 1, LAWN.cellW - 2, LAWN.cellH - 2)
        ctx.strokeStyle = 'rgba(20,80,20,0.35)'
        ctx.strokeRect(x + 0.5, y + 0.5, LAWN.cellW - 1, LAWN.cellH - 1)
      }
    }

    // mowers
    for (let r = 0; r < GRID_ROWS; r++) {
      if (!snap.mowers[r]) continue
      const y = LAWN.originY + r * LAWN.cellH + LAWN.cellH / 2
      drawImage(assets.mower, 130, y, 56, 40, '#c0392b')
    }

    // plants
    for (const p of snap.plants) {
      const x = LAWN.originX + p.col * LAWN.cellW + LAWN.cellW / 2
      const y = LAWN.originY + p.row * LAWN.cellH + LAWN.cellH / 2
      const img = assets.plants[p.plantId]
      const alpha =
        getPlant(p.plantId).behavior === 'potato_mine' && !p.armed ? 0.5 : 1
      ctx.globalAlpha = alpha
      drawImage(img, x, y, 72, 80, PLANT_FALLBACK[p.plantId] ?? '#66bb6a')
      ctx.globalAlpha = 1
      // hp bar
      if (p.hp < p.maxHp) {
        ctx.fillStyle = '#222'
        ctx.fillRect(x - 24, y + 36, 48, 5)
        ctx.fillStyle = '#2ecc71'
        ctx.fillRect(x - 24, y + 36, 48 * (p.hp / p.maxHp), 5)
      }
    }

    // zombies
    for (const z of snap.zombies) {
      const y = LAWN.originY + z.row * LAWN.cellH + LAWN.cellH / 2
      const img = assets.zombies[z.zombieId]
      const isBoss = getZombie(z.zombieId).behavior === 'gargantuar'
      const w = isBoss ? 90 : 64
      const h = isBoss ? 110 : 86
      ctx.globalAlpha = z.flying ? 0.75 : 1
      drawImage(img, z.x, y, w, h, ZOMBIE_FALLBACK[z.zombieId] ?? '#90a4ae')
      ctx.globalAlpha = 1
      const total = z.hp + z.armorHp
      const max = getZombie(z.zombieId).maxHp + getZombie(z.zombieId).armorHp
      ctx.fillStyle = '#222'
      ctx.fillRect(z.x - 28, y - h / 2 - 10, 56, 5)
      ctx.fillStyle = z.armorHp > 0 ? '#95a5a6' : '#e74c3c'
      ctx.fillRect(z.x - 28, y - h / 2 - 10, 56 * Math.max(0, total / max), 5)
    }

    // projectiles
    for (const b of snap.projectiles) {
      const y = LAWN.originY + b.row * LAWN.cellH + LAWN.cellH / 2
      const img = b.fire ? assets.firePea : b.slows ? assets.snowPea : assets.pea
      drawImage(img, b.x, y, 22, 22, b.fire ? '#ff5722' : b.slows ? '#4fc3f7' : '#8bc34a')
    }

    // suns
    for (const s of snap.suns) {
      drawImage(assets.sun, s.x, s.y, 44, 44, '#ffeb3b')
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(String(s.amount), s.x - 6, s.y + 4)
    }

    // huge wave banner
    if (snap.hugeWave || (snap.toast && snap.toast.includes('一大波'))) {
      ctx.fillStyle = 'rgba(120,0,0,0.55)'
      ctx.fillRect(280, 300, 720, 70)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px "Segoe UI", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('一大波僵尸正在接近！', 640, 345)
      ctx.textAlign = 'left'
    }
  }

  const loop = (now: number) => {
    if (destroyed) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    engine.tick(dt)
    paint()
    uiAcc += dt
    if (uiAcc >= 0.1 || engine.status !== 'playing') {
      uiAcc = 0
      onUi()
    }
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  paint()
  onUi()

  return {
    destroy: () => {
      destroyed = true
      cancelAnimationFrame(raf)
      canvas.removeEventListener('click', onClick)
    },
  }
}
