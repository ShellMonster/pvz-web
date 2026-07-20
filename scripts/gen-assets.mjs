#!/usr/bin/env node
/**
 * Concurrent sprite generator + chroma-key to alpha PNG.
 * Model gpt-image-2 does not accept background:transparent — we generate on
 * solid chroma green then remove with sharp.
 *
 * Env: IMAGE_API_BASE, IMAGE_API_KEY, IMAGE_MODEL, IMAGE_CONCURRENCY
 * Usage: node scripts/gen-assets.mjs [all|plant|zombie|ui|fx|bg]
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
const fetchTimeoutMs = Number(process.env.IMAGE_TIMEOUT_MS || 300000)

const CHROMA =
  'solid flat pure #00FF00 chroma-key green background only, no shadows on background, subject fully separated from background'

const STYLE =
  'Plants vs Zombies inspired original fan-style game art, cute cartoon, clean thick black outlines, bright saturated colors, consistent chibi proportions, isolated subject, centered, no text, no watermark, high quality game sprite'

/** @type {{id:string, dir:string, prompt:string, opaque?:boolean}[]} */
const ASSETS = [
  { id: 'sunflower', dir: 'plants', prompt: 'cheerful sunflower plant with face, facing slightly right' },
  { id: 'peashooter', dir: 'plants', prompt: 'green peashooter plant with open mouth cannon facing right' },
  { id: 'wallnut', dir: 'plants', prompt: 'brown tough walnut plant wall with determined face' },
  { id: 'snowpea', dir: 'plants', prompt: 'icy blue peashooter plant with frost, facing right' },
  { id: 'cherrybomb', dir: 'plants', prompt: 'two red cherry bombs with fuses and cute faces' },
  { id: 'potatomine', dir: 'plants', prompt: 'potato mine plant with spiky top and smiling face' },
  { id: 'repeater', dir: 'plants', prompt: 'double-headed green peashooter plant facing right' },
  { id: 'tallnut', dir: 'plants', prompt: 'very tall brown nut wall plant, towering defensive face' },
  { id: 'jalapeno', dir: 'plants', prompt: 'red hot jalapeno pepper plant with fiery cute face' },
  { id: 'spikeweed', dir: 'plants', prompt: 'green ground spikeweed plant with sharp spikes, low profile' },
  { id: 'torchwood', dir: 'plants', prompt: 'wooden torch tree stump plant with bright flame on top' },
  { id: 'sunflower_twin', dir: 'plants', prompt: 'twin double sunflower plant with two flower heads' },
  { id: 'normal', dir: 'zombies', prompt: 'classic green cartoon zombie walking left, torn blue clothes' },
  { id: 'flag', dir: 'zombies', prompt: 'cartoon zombie holding a small red flag, walking left' },
  { id: 'cone', dir: 'zombies', prompt: 'cartoon zombie with orange traffic cone on head, walking left' },
  { id: 'bucket', dir: 'zombies', prompt: 'cartoon zombie with metal bucket helmet, walking left' },
  { id: 'newspaper', dir: 'zombies', prompt: 'cartoon zombie reading a newspaper shield, walking left' },
  { id: 'screendoor', dir: 'zombies', prompt: 'cartoon zombie holding a metal screen door shield, walking left' },
  { id: 'football', dir: 'zombies', prompt: 'fast cartoon zombie in football armor, charging left' },
  { id: 'dancer', dir: 'zombies', prompt: 'disco dancer cartoon zombie with funky clothes, facing left' },
  { id: 'balloon', dir: 'zombies', prompt: 'cartoon zombie floating with red balloon, flying left' },
  { id: 'gargantuar', dir: 'zombies', prompt: 'huge muscular giant cartoon zombie boss with club, facing left' },
  { id: 'sun', dir: 'ui', prompt: 'golden glowing sun coin collectible icon with smiling face, circular' },
  { id: 'mower', dir: 'ui', prompt: 'red lawn mower side view cartoon game item facing right' },
  { id: 'seed-packet', dir: 'ui', prompt: 'green seed packet card frame UI for plant selection' },
  { id: 'shovel', dir: 'ui', prompt: 'garden shovel icon cartoon game UI tool' },
  { id: 'pea', dir: 'effects', prompt: 'single green pea projectile sphere, simple game bullet' },
  { id: 'snow-pea', dir: 'effects', prompt: 'icy blue snow pea projectile sphere with frost' },
  { id: 'fire-pea', dir: 'effects', prompt: 'fiery orange red flaming pea projectile sphere' },
  {
    id: 'lawn-day',
    dir: 'backgrounds',
    opaque: true,
    prompt:
      'wide daytime suburban backyard lawn battlefield for tower defense, house silhouette left, green grass, blue sky, no characters, no text, 16:9 scene',
  },
  {
    id: 'house',
    dir: 'backgrounds',
    prompt: 'cute suburban house side view strip for left of lawn, cartoon',
  },
]

function outPath(dir, id) {
  return path.join(root, 'public/assets', dir, `${id}.png`)
}

/** Remove near-#00FF00 green pixels → alpha */
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
    // strong green, low red/blue
    if (g > 140 && g > r * 1.35 && g > b * 1.35) {
      data[i + 3] = 0
    } else if (g > 120 && r < 90 && b < 90) {
      data[i + 3] = Math.min(data[i + 3], 40)
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer()
}

async function genOne(item, attempt = 0) {
  if (!key) {
    console.error('IMAGE_API_KEY missing')
    return false
  }
  const file = outPath(item.dir, item.id)
  // Keep existing AI or solid assets; only skip if reasonably sized
  if (fs.existsSync(file) && fs.statSync(file).size > 15000 && !process.env.IMAGE_FORCE) {
    console.log('skip exists', path.relative(root, file))
    return true
  }

  const prompt = item.opaque
    ? `${item.prompt}. ${STYLE.replace('isolated subject, centered, ', '')}`
    : `${STYLE}. ${item.prompt}. ${CHROMA}`

  const body = {
    model,
    prompt,
    n: 1,
    size: item.opaque ? '1536x1024' : '1024x1024',
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), fetchTimeoutMs)
    const res = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const t = await res.text()
      console.error('fail', item.id, res.status, t.slice(0, 200))
      if (attempt < 2 && (res.status >= 500 || res.status === 429)) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
        return genOne(item, attempt + 1)
      }
      return false
    }
    const json = await res.json()
    const b64 = json.data?.[0]?.b64_json
    const url = json.data?.[0]?.url
    let buf
    if (b64) buf = Buffer.from(b64, 'base64')
    else if (url) {
      const img = await fetch(url)
      if (!img.ok) {
        console.error('fail download', item.id, img.status)
        return false
      }
      buf = Buffer.from(await img.arrayBuffer())
    } else {
      console.error('no image data', item.id)
      return false
    }

    fs.mkdirSync(path.dirname(file), { recursive: true })
    if (!item.opaque) {
      try {
        buf = await chromaKeyToAlpha(buf)
      } catch (e) {
        console.warn('chroma failed, keeping original', item.id, e.message)
      }
    }
    // downscale sprites for game use
    if (!item.opaque) {
      buf = await sharp(buf)
        .resize(256, 256, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    } else {
      buf = await sharp(buf).resize(1280, 720, { fit: 'cover' }).png().toBuffer()
    }
    fs.writeFileSync(file, buf)
    console.log('ok', path.relative(root, file), buf.length)
    return true
  } catch (e) {
    console.error('error', item.id, e.cause?.code || e.message)
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)))
      return genOne(item, attempt + 1)
    }
    return false
  }
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
        console.error('worker crash', items[idx]?.id, e.message)
        results[idx] = false
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

async function main() {
  const mode = process.argv[2] || 'all'
  let items = ASSETS
  if (mode === 'plant') items = ASSETS.filter((a) => a.dir === 'plants')
  else if (mode === 'zombie') items = ASSETS.filter((a) => a.dir === 'zombies')
  else if (mode === 'ui') items = ASSETS.filter((a) => a.dir === 'ui')
  else if (mode === 'fx') items = ASSETS.filter((a) => a.dir === 'effects')
  else if (mode === 'bg') items = ASSETS.filter((a) => a.dir === 'backgrounds')

  console.log('API', base, 'model', model, 'items', items.length, 'concurrency', concurrency)
  const results = await pool(items, concurrency, genOne)
  const ok = results.filter(Boolean).length
  console.log(`done ${ok}/${items.length}`)
  if (ok === 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
