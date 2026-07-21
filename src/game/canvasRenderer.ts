import { GRID_COLS, GRID_ROWS, LAWN, DESIGN_HEIGHT, DESIGN_WIDTH } from '@/data/balance'
import { ANIM_SETS, animFramePath, type AnimAction } from '@/game/animCatalog'
import type { BattleEngine, PlantEntity, ZombieEntity } from '@/game/logic/battleEngine'
import { getPlant } from '@/data/plants'
import { getZombie } from '@/data/zombies'

export type AssetMap = {
  plants: Record<string, HTMLImageElement | null>
  zombies: Record<string, HTMLImageElement | null>
  /** anim[kind][id][action][frame] */
  anim: Record<string, Record<string, Record<string, HTMLImageElement[]>>>
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

async function loadAnimFrames(): Promise<AssetMap['anim']> {
  const anim: AssetMap['anim'] = {}
  const tasks: Promise<void>[] = []
  for (const set of ANIM_SETS) {
    anim[set.kind] ??= {}
    anim[set.kind]![set.id] ??= {}
    for (const clip of set.clips) {
      const frames: HTMLImageElement[] = []
      anim[set.kind]![set.id]![clip.action] = frames
      for (let i = 0; i < clip.frames; i++) {
        const idx = i
        const src = animFramePath(set.kind, set.id, clip.action, idx)
        tasks.push(
          loadImage(src).then((img) => {
            if (img) frames[idx] = img
          }),
        )
      }
    }
  }
  await Promise.all(tasks)
  // compact holes
  for (const kind of Object.keys(anim)) {
    for (const id of Object.keys(anim[kind]!)) {
      for (const action of Object.keys(anim[kind]![id]!)) {
        anim[kind]![id]![action] = (anim[kind]![id]![action] || []).filter(Boolean)
      }
    }
  }
  return anim
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
  const [anim] = await Promise.all([
    loadAnimFrames(),
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
    anim,
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

function getClipMeta(kind: string, id: string, action: AnimAction) {
  const set = ANIM_SETS.find((s) => s.kind === kind && s.id === id)
  return set?.clips.find((c) => c.action === action)
}

function pickAnimFrame(
  assets: AssetMap,
  kind: string,
  id: string,
  action: AnimAction,
  elapsed: number,
): HTMLImageElement | null {
  const frames = assets.anim[kind]?.[id]?.[action]
  if (!frames || frames.length === 0) return null
  const meta = getClipMeta(kind, id, action)
  const dur = meta?.frameDuration ?? 0.15
  const loop = meta?.loop ?? true
  const idx = loop
    ? Math.floor(elapsed / dur) % frames.length
    : Math.min(frames.length - 1, Math.floor(elapsed / dur))
  return frames[idx] ?? frames[0] ?? null
}

export interface CanvasBattleHandle {
  destroy: () => void
}

/**
 * Pure Canvas2D battle view with frame animations + procedural motion.
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
  let animTime = 0

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

  const drawSprite = (
    img: HTMLImageElement | null | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    fallback: string,
    opts?: {
      rotation?: number
      scaleX?: number
      scaleY?: number
      alpha?: number
      flipX?: boolean
      flash?: boolean
    },
  ) => {
    const rotation = opts?.rotation ?? 0
    const scaleX = (opts?.scaleX ?? 1) * (opts?.flipX ? -1 : 1)
    const scaleY = opts?.scaleY ?? 1
    const alpha = opts?.alpha ?? 1
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.scale(scaleX, scaleY)
    ctx.globalAlpha = alpha
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
      if (opts?.flash) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.fillRect(-w / 2, -h / 2, w, h)
        ctx.globalCompositeOperation = 'source-over'
      }
    } else {
      ctx.fillStyle = fallback
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-w / 2, -h / 2, w, h, 8)
      } else {
        ctx.rect(-w / 2, -h / 2, w, h)
      }
      ctx.fill()
    }
    ctx.restore()
  }

  const plantSprite = (p: PlantEntity): HTMLImageElement | null => {
    const def = getPlant(p.plantId)
    // 射击帧优先
    if (p.shootAnim > 0 && def.behavior === 'shooter') {
      const elapsed = 0.28 - p.shootAnim
      const frame = pickAnimFrame(assets, 'plants', p.plantId, 'shoot', elapsed)
      if (frame) return frame
    }
    // 产阳光帧
    if (p.produceAnim > 0 && def.behavior === 'sun_producer') {
      const elapsed = 0.45 - p.produceAnim
      const frame = pickAnimFrame(assets, 'plants', p.plantId, 'produce', elapsed)
      if (frame) return frame
    }
    const idle = pickAnimFrame(assets, 'plants', p.plantId, 'idle', animTime + p.col * 0.2)
    return idle ?? assets.plants[p.plantId] ?? null
  }

  const zombieSprite = (z: ZombieEntity): HTMLImageElement | null => {
    if (z.chewing) {
      const chew = pickAnimFrame(assets, 'zombies', z.zombieId, 'chew', z.walkPhase)
      if (chew) return chew
    }
    // walkPhase 驱动走路帧
    const frames = assets.anim.zombies?.[z.zombieId]?.walk
    if (frames && frames.length) {
      // walkPhase 约 2π 一步；映射到帧
      const idx = Math.floor((z.walkPhase / (Math.PI / 2)) % frames.length)
      return frames[((idx % frames.length) + frames.length) % frames.length] ?? frames[0]!
    }
    return assets.zombies[z.zombieId] ?? null
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

    if (assets.house && assets.house.naturalWidth) {
      ctx.drawImage(assets.house, 0, 60, 160, 600)
    } else {
      ctx.fillStyle = '#8b5a2b'
      ctx.fillRect(0, 80, 150, 560)
      ctx.fillStyle = '#f5deb3'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('房子', 40, 155)
    }

    // lawn cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = LAWN.originX + c * LAWN.cellW
        const y = LAWN.originY + r * LAWN.cellH
        ctx.fillStyle =
          (r + c) % 2 === 0 ? 'rgba(60,140,50,0.45)' : 'rgba(80,160,60,0.35)'
        ctx.fillRect(x + 1, y + 1, LAWN.cellW - 2, LAWN.cellH - 2)
      }
    }

    // mowers
    for (let r = 0; r < GRID_ROWS; r++) {
      if (!snap.mowers[r]) continue
      const y = LAWN.originY + r * LAWN.cellH + LAWN.cellH / 2
      const buzz = Math.sin(animTime * 20 + r) * 1.5
      drawSprite(assets.mower, 130 + buzz, y, 56, 40, '#c0392b')
    }

    // plants
    for (const p of snap.plants) {
      const baseX = LAWN.originX + p.col * LAWN.cellW + LAWN.cellW / 2
      const baseY = LAWN.originY + p.row * LAWN.cellH + LAWN.cellH / 2
      const def = getPlant(p.plantId)
      const img = plantSprite(p)

      // 程序化动画叠加
      let bob = Math.sin(animTime * 2.4 + p.col * 0.7 + p.row) * 2.2
      let sway = Math.sin(animTime * 1.6 + p.col) * 0.04
      let scaleX = 1
      let scaleY = 1
      let dx = 0

      if (def.behavior === 'sun_producer') {
        bob = Math.sin(animTime * 3 + p.col) * 3.5
        scaleY = 1 + Math.sin(animTime * 3 + p.col) * 0.04
        if (p.produceAnim > 0) {
          const t = 1 - p.produceAnim / 0.45
          scaleY += Math.sin(t * Math.PI) * 0.18
          bob -= Math.sin(t * Math.PI) * 8
        }
      }
      if (def.behavior === 'shooter' && p.shootAnim > 0) {
        const t = p.shootAnim / 0.28
        // 后坐：向左缩、压扁
        dx = -(1 - t) * 10
        scaleX = 1 - (1 - t) * 0.18
        scaleY = 1 + (1 - t) * 0.12
      }
      if (p.plantAnim > 0) {
        const t = p.plantAnim / 0.35
        scaleY *= 0.6 + (1 - t) * 0.4
        bob += t * 20
      }
      if (def.behavior === 'potato_mine' && !p.armed) {
        scaleY *= 0.85 + Math.sin(animTime * 5) * 0.05
      }
      if (def.behavior === 'torch') {
        scaleY *= 1 + Math.sin(animTime * 10) * 0.06
      }

      const alpha =
        def.behavior === 'potato_mine' && !p.armed
          ? 0.55 + Math.sin(animTime * 6) * 0.1
          : 1

      drawSprite(
        img,
        baseX + dx,
        baseY + bob,
        72,
        80,
        PLANT_FALLBACK[p.plantId] ?? '#66bb6a',
        { rotation: sway, scaleX, scaleY, alpha },
      )

      // 枪口火花
      if (def.behavior === 'shooter' && p.shootAnim > 0.12) {
        const flash = (p.shootAnim - 0.12) / 0.16
        ctx.save()
        ctx.globalAlpha = flash
        ctx.fillStyle = def.slows ? '#81d4fa' : '#c8e6c9'
        ctx.beginPath()
        ctx.arc(baseX + 38 + dx, baseY - 4 + bob, 8 + flash * 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (p.hp < p.maxHp) {
        ctx.fillStyle = '#222'
        ctx.fillRect(baseX - 24, baseY + 38, 48, 5)
        ctx.fillStyle = '#2ecc71'
        ctx.fillRect(baseX - 24, baseY + 38, 48 * (p.hp / p.maxHp), 5)
      }
    }

    // zombies
    for (const z of snap.zombies) {
      const baseY = LAWN.originY + z.row * LAWN.cellH + LAWN.cellH / 2
      const img = zombieSprite(z)
      const isBoss = getZombie(z.zombieId).behavior === 'gargantuar'
      const w = isBoss ? 90 : 64
      const h = isBoss ? 110 : 86

      // 走路：上下颠簸 + 轻微倾斜 + 挤压
      const step = Math.sin(z.walkPhase)
      const step2 = Math.sin(z.walkPhase * 2)
      let bob = z.chewing ? Math.sin(z.walkPhase) * 2 : Math.abs(step) * 5
      let rot = z.chewing ? Math.sin(z.walkPhase) * 0.05 : step * 0.08
      let scaleX = 1 + step2 * 0.04
      let scaleY = 1 - Math.abs(step) * 0.06
      if (z.flying) {
        bob = Math.sin(animTime * 3 + z.walkPhase) * 8
        rot = Math.sin(animTime * 2) * 0.05
        scaleX = 1
        scaleY = 1
      }
      if (z.rage) {
        rot += Math.sin(animTime * 20) * 0.03
      }

      drawSprite(
        img,
        z.x,
        baseY + bob,
        w,
        h,
        ZOMBIE_FALLBACK[z.zombieId] ?? '#90a4ae',
        {
          rotation: rot,
          scaleX,
          scaleY,
          alpha: z.flying ? 0.8 : 1,
          flash: z.hitFlash > 0,
        },
      )

      const total = z.hp + z.armorHp
      const max = getZombie(z.zombieId).maxHp + getZombie(z.zombieId).armorHp
      ctx.fillStyle = '#222'
      ctx.fillRect(z.x - 28, baseY - h / 2 - 12 + bob, 56, 5)
      ctx.fillStyle = z.armorHp > 0 ? '#95a5a6' : '#e74c3c'
      ctx.fillRect(
        z.x - 28,
        baseY - h / 2 - 12 + bob,
        56 * Math.max(0, total / max),
        5,
      )
    }

    // projectiles
    for (const b of snap.projectiles) {
      const y = LAWN.originY + b.row * LAWN.cellH + LAWN.cellH / 2
      const img = b.fire ? assets.firePea : b.slows ? assets.snowPea : assets.pea
      drawSprite(
        img,
        b.x,
        y,
        24,
        24,
        b.fire ? '#ff5722' : b.slows ? '#4fc3f7' : '#8bc34a',
        { rotation: b.spin, scaleX: 1.05, scaleY: 0.95 },
      )
    }

    // suns
    for (const s of snap.suns) {
      const drop =
        s.dropAnim > 0 ? (1 - Math.cos((1 - s.dropAnim / 0.45) * Math.PI)) * 24 : 0
      const floatY = Math.sin(animTime * 3 + s.spin) * 3
      const sunFrame =
        pickAnimFrame(assets, 'ui', 'sun', 'spin', animTime + s.spin) ?? assets.sun
      drawSprite(
        sunFrame,
        s.x,
        s.y - drop + floatY,
        46,
        46,
        '#ffeb3b',
        {
          rotation: s.spin * 0.5,
          scaleX: 1 + Math.sin(animTime * 4 + s.spin) * 0.06,
          scaleY: 1 + Math.sin(animTime * 4 + s.spin) * 0.06,
        },
      )
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(String(s.amount), s.x - 8, s.y - drop + floatY + 4)
    }

    if (snap.hugeWave || (snap.toast && snap.toast.includes('一大波'))) {
      const pulse = 0.5 + Math.sin(animTime * 8) * 0.15
      ctx.fillStyle = `rgba(120,0,0,${pulse})`
      ctx.fillRect(280, 300, 720, 70)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('一大波僵尸正在接近！', 640, 345)
      ctx.textAlign = 'left'
    }
  }

  const loop = (now: number) => {
    if (destroyed) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    animTime += dt
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
