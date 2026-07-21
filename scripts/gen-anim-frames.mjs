#!/usr/bin/env node
/**
 * 并发生成角色帧动画（绿幕 + sharp 抠透明）。
 *
 * 用法：
 *   IMAGE_API_KEY=... node scripts/gen-anim-frames.mjs
 *   node scripts/gen-anim-frames.mjs sunflower peashooter normal
 *   IMAGE_FORCE=1 node scripts/gen-anim-frames.mjs zombie
 *
 * Env: IMAGE_API_BASE, IMAGE_API_KEY, IMAGE_MODEL, IMAGE_CONCURRENCY, IMAGE_TIMEOUT_MS, IMAGE_FORCE
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const base = (process.env.IMAGE_API_BASE || 'http://localhost:8317/v1').replace(/\/$/, '')
const key = process.env.IMAGE_API_KEY || ''
const model = process.env.IMAGE_MODEL || 'gpt-image-2'
const concurrency = Number(process.env.IMAGE_CONCURRENCY || 3)
const fetchTimeoutMs = Number(process.env.IMAGE_TIMEOUT_MS || 360000)
const force = Boolean(process.env.IMAGE_FORCE)

const STYLE =
  'Plants vs Zombies inspired original fan-style game art, cute cartoon, clean thick black outlines, bright colors, consistent character design across animation frames, same face and outfit, isolated subject, centered, no text, no watermark, high quality game sprite'

const CHROMA =
  'solid flat pure #00FF00 chroma-key green background only, no ground, no shadow plate'

/** 与 src/game/animCatalog.ts 保持同步（脚本侧自包含，避免 TS import） */
const SETS = [
  {
    kind: 'plants',
    id: 'sunflower',
    clips: {
      idle: [
        'standing gently, leaves slightly left, calm smile',
        'standing, leaves center, face slightly up, happy',
        'standing, leaves slightly right, calm smile',
        'standing, leaves center, face slightly down, gentle bounce',
      ],
      produce: [
        'sunflower glowing brighter, about to release a sun coin',
        'sunflower stretched upward releasing golden sun energy',
        'sunflower after producing sun, settling back',
      ],
    },
    base: 'cheerful cartoon sunflower plant with face, green stem and leaves',
  },
  {
    kind: 'plants',
    id: 'sunflower_twin',
    clips: {
      idle: [
        'twin sunflowers both facing forward, calm',
        'left head slightly up, right head forward',
        'both heads bob gently',
        'right head slightly up, left head forward',
      ],
      produce: [
        'both heads glowing',
        'releasing golden sun energy',
        'settling after produce',
      ],
    },
    base: 'twin double sunflower plant with two flower heads',
  },
  {
    kind: 'plants',
    id: 'peashooter',
    clips: {
      idle: [
        'green peashooter idle, mouth closed slightly, facing right',
        'peashooter idle, body slightly taller, facing right',
        'peashooter idle, body settles, facing right',
      ],
      shoot: [
        'peashooter cheek puffed preparing to shoot, facing right',
        'peashooter mouth wide open firing a green pea, muzzle blast, facing right',
        'peashooter recoil after shot, mouth half open, facing right',
      ],
    },
    base: 'green peashooter plant with open mouth cannon facing right',
  },
  {
    kind: 'plants',
    id: 'snowpea',
    clips: {
      idle: [
        'icy blue peashooter idle facing right',
        'snowpea slightly taller idle facing right',
        'snowpea settles idle facing right',
      ],
      shoot: [
        'snowpea cheek puffed with frost, facing right',
        'snowpea firing icy blue pea with frost burst, facing right',
        'snowpea recoil after ice shot, facing right',
      ],
    },
    base: 'icy blue peashooter plant facing right with frost',
  },
  {
    kind: 'plants',
    id: 'repeater',
    clips: {
      idle: [
        'double-headed peashooter idle both mouths calm, facing right',
        'repeater idle slight bob, facing right',
        'repeater idle settle, facing right',
      ],
      shoot: [
        'top head about to shoot, bottom ready, facing right',
        'both heads firing green peas, facing right',
        'both heads recoil after double shot, facing right',
      ],
    },
    base: 'double-headed green peashooter plant facing right',
  },
  {
    kind: 'plants',
    id: 'wallnut',
    clips: {
      idle: [
        'walnut wall plant calm determined face',
        'walnut wall plant face slightly clenched',
        'walnut wall plant calm again',
      ],
    },
    base: 'brown tough walnut plant wall tank',
  },
  {
    kind: 'plants',
    id: 'tallnut',
    clips: {
      idle: [
        'tall nut wall calm',
        'tall nut wall slight sway left',
        'tall nut wall slight sway right',
      ],
    },
    base: 'very tall brown nut wall plant',
  },
  {
    kind: 'plants',
    id: 'torchwood',
    clips: {
      idle: [
        'torchwood flame small',
        'torchwood flame medium flicker',
        'torchwood flame large',
        'torchwood flame medium flicker other side',
      ],
    },
    base: 'wooden torch stump plant with flame on top',
  },
  {
    kind: 'plants',
    id: 'potatomine',
    clips: {
      idle: [
        'potato mine half buried calm',
        'potato mine spikes slightly up',
        'potato mine calm again',
      ],
    },
    base: 'potato mine plant with spiky top',
  },
]

const zombieIds = [
  ['normal', 'classic green zombie blue clothes'],
  ['flag', 'zombie holding small red flag'],
  ['cone', 'zombie with orange traffic cone helmet'],
  ['bucket', 'zombie with metal bucket helmet'],
  ['newspaper', 'zombie holding newspaper'],
  ['screendoor', 'zombie holding screen door shield'],
  ['football', 'zombie in football armor'],
  ['dancer', 'disco dancer zombie'],
  ['balloon', 'zombie floating with red balloon'],
  ['gargantuar', 'huge giant zombie boss with club'],
]

for (const [id, desc] of zombieIds) {
  SETS.push({
    kind: 'zombies',
    id,
    base: `cartoon zombie, ${desc}, full body facing left`,
    clips: {
      walk: [
        'walking left, left foot forward, right foot back, arms forward',
        'walking left, mid stride, body slightly lower',
        'walking left, right foot forward, left foot back, arms forward',
        'walking left, mid stride opposite, body slightly lower',
      ],
      chew: [
        'standing chewing plant, mouth open, facing left',
        'standing chewing, head bob down, facing left',
        'standing chewing, head bob up, facing left',
      ],
    },
  })
}

SETS.push({
  kind: 'ui',
  id: 'sun',
  base: 'golden smiling sun coin collectible icon circular',
  clips: {
    spin: [
      'sun coin face upright',
      'sun coin rotated 20 degrees',
      'sun coin rotated 40 degrees glow brighter',
      'sun coin rotated 60 degrees',
    ],
  },
})

async function chromaKeyToAlpha(inputBuf) {
  const { data, info } = await sharp(inputBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (g > 140 && g > r * 1.35 && g > b * 1.35) data[i + 3] = 0
    else if (g > 120 && r < 90 && b < 90) data[i + 3] = Math.min(data[i + 3], 40)
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer()
}

function outFile(kind, id, action, frame) {
  return path.join(root, 'public/assets/anim', kind, id, `${action}_${frame}.png`)
}

async function genFrame(job, attempt = 0) {
  if (!key) {
    console.error('IMAGE_API_KEY missing')
    return false
  }
  const file = outFile(job.kind, job.id, job.action, job.frame)
  if (!force && fs.existsSync(file) && fs.statSync(file).size > 8000) {
    console.log('skip', path.relative(root, file))
    return true
  }

  const prompt = [
    STYLE,
    job.base,
    `animation frame ${job.frame + 1} of ${job.total}: ${job.pose}`,
    'same character design as other frames of this animation sequence',
    CHROMA,
  ].join('. ')

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), fetchTimeoutMs)
    const res = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: '1024x1024',
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const t = await res.text()
      console.error('fail', job.id, job.action, job.frame, res.status, t.slice(0, 160))
      if (attempt < 2 && (res.status >= 500 || res.status === 429)) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
        return genFrame(job, attempt + 1)
      }
      return false
    }
    const json = await res.json()
    let buf
    if (json.data?.[0]?.b64_json) buf = Buffer.from(json.data[0].b64_json, 'base64')
    else if (json.data?.[0]?.url) {
      const img = await fetch(json.data[0].url)
      buf = Buffer.from(await img.arrayBuffer())
    } else {
      console.error('no image', job.id, job.action, job.frame)
      return false
    }
    try {
      buf = await chromaKeyToAlpha(buf)
    } catch {
      /* keep */
    }
    buf = await sharp(buf)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, buf)
    console.log('ok', path.relative(root, file), buf.length)
    return true
  } catch (e) {
    console.error('error', job.id, job.action, job.frame, e.cause?.code || e.message)
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)))
      return genFrame(job, attempt + 1)
    }
    return false
  }
}

function buildJobs(filterArgs) {
  let sets = SETS
  if (filterArgs.length) {
    const f = new Set(filterArgs)
    if (f.has('plant') || f.has('plants')) {
      sets = SETS.filter((s) => s.kind === 'plants')
    } else if (f.has('zombie') || f.has('zombies')) {
      sets = SETS.filter((s) => s.kind === 'zombies')
    } else if (f.has('ui')) {
      sets = SETS.filter((s) => s.kind === 'ui')
    } else {
      sets = SETS.filter((s) => f.has(s.id))
    }
  }
  const jobs = []
  for (const s of sets) {
    for (const [action, poses] of Object.entries(s.clips)) {
      poses.forEach((pose, frame) => {
        jobs.push({
          kind: s.kind,
          id: s.id,
          action,
          frame,
          total: poses.length,
          pose,
          base: s.base,
        })
      })
    }
  }
  return jobs
}

async function pool(items, limit, worker) {
  let i = 0
  const results = []
  async function run() {
    while (i < items.length) {
      const idx = i++
      try {
        results[idx] = await worker(items[idx])
      } catch (e) {
        console.error('worker', e.message)
        results[idx] = false
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

async function main() {
  if (!key) {
    console.error('请设置 IMAGE_API_KEY')
    process.exit(1)
  }
  const jobs = buildJobs(process.argv.slice(2))
  console.log(
    'API',
    base,
    'model',
    model,
    'jobs',
    jobs.length,
    'concurrency',
    concurrency,
    force ? 'FORCE' : '',
  )
  const results = await pool(jobs, concurrency, genFrame)
  const ok = results.filter(Boolean).length
  console.log(`done ${ok}/${jobs.length}`)
  // write manifest for runtime
  const manifest = {}
  for (const s of SETS) {
    const key = `${s.kind}/${s.id}`
    manifest[key] = {}
    for (const [action, poses] of Object.entries(s.clips)) {
      const existing = []
      for (let i = 0; i < poses.length; i++) {
        const f = outFile(s.kind, s.id, action, i)
        if (fs.existsSync(f) && fs.statSync(f).size > 1000) existing.push(i)
      }
      if (existing.length) {
        manifest[key][action] = {
          frames: existing.length,
          // if some missing mid-sequence, only keep contiguous from 0
          count: existing[0] === 0 ? existing.length : 0,
        }
        // recount contiguous
        let n = 0
        while (fs.existsSync(outFile(s.kind, s.id, action, n)) && fs.statSync(outFile(s.kind, s.id, action, n)).size > 1000) n++
        manifest[key][action] = { frames: n }
      }
    }
  }
  const manPath = path.join(root, 'public/assets/anim/manifest.json')
  fs.mkdirSync(path.dirname(manPath), { recursive: true })
  fs.writeFileSync(manPath, JSON.stringify(manifest, null, 2))
  console.log('manifest', manPath)
  if (ok === 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
