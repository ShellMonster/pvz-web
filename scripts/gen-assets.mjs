#!/usr/bin/env node
/**
 * Concurrent transparent-background sprite generator.
 * Env: IMAGE_API_BASE, IMAGE_API_KEY, IMAGE_MODEL
 * Usage: node scripts/gen-assets.mjs [plant|zombie|all]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const base = process.env.IMAGE_API_BASE || 'http://localhost:8317/v1'
const key = process.env.IMAGE_API_KEY || ''
const model = process.env.IMAGE_MODEL || 'gpt-image-2'

const STYLE =
  'Plants vs Zombies inspired original fan art, cute cartoon, clean thick outlines, bright colors, consistent proportions, isolated game sprite, full subject centered, transparent background, no ground shadow plate, no scenery, PNG alpha, high quality'

const plants = [
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
const zombies = [
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

async function genOne(prompt, outFile) {
  if (!key) {
    console.warn('No IMAGE_API_KEY — skip', outFile)
    return false
  }
  const res = await fetch(`${base}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: `${STYLE}. ${prompt}`,
      size: '1024x1024',
      // request transparent when API supports it
      background: 'transparent',
    }),
  })
  if (!res.ok) {
    console.error('fail', outFile, await res.text())
    return false
  }
  const json = await res.json()
  const b64 = json.data?.[0]?.b64_json
  const url = json.data?.[0]?.url
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  if (b64) {
    fs.writeFileSync(outFile, Buffer.from(b64, 'base64'))
  } else if (url) {
    const img = await fetch(url)
    fs.writeFileSync(outFile, Buffer.from(await img.arrayBuffer()))
  } else {
    console.error('no image data', outFile)
    return false
  }
  console.log('ok', outFile)
  return true
}

async function main() {
  const mode = process.argv[2] || 'all'
  const jobs = []
  if (mode === 'all' || mode === 'plant') {
    for (const id of plants) {
      jobs.push(
        genOne(
          `cute cartoon plant character "${id}" game unit facing right`,
          path.join(root, 'public/assets/plants', `${id}.png`),
        ),
      )
    }
  }
  if (mode === 'all' || mode === 'zombie') {
    for (const id of zombies) {
      jobs.push(
        genOne(
          `cute cartoon zombie character "${id}" game unit facing left`,
          path.join(root, 'public/assets/zombies', `${id}.png`),
        ),
      )
    }
  }
  // concurrency 4
  const queue = [...jobs]
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const j = queue.shift()
      if (j) await j
    }
  })
  await Promise.all(workers)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
