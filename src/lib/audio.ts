import { Howl } from 'howler'
import { useSettingsStore } from '@/stores/settingsStore'

/** Tiny silent-capable procedural placeholders (data URI beeps). */
const SFX: Record<string, string> = {
  // short click-ish wav base64 would be large; use Howler with volume 0 fallback
  select: '',
  win: '',
  lose: '',
}

let cache: Record<string, Howl> = {}

export function playSfx(name: keyof typeof SFX | string) {
  try {
    const vol = useSettingsStore.getState().sfx
    if (vol <= 0) return
    const src = SFX[name]
    if (!src) return
    if (!cache[name]) {
      cache[name] = new Howl({ src: [src], volume: vol })
    }
    cache[name]!.volume(vol)
    cache[name]!.play()
  } catch {
    // audio optional
  }
}

export function resetAudioCache() {
  cache = {}
}
