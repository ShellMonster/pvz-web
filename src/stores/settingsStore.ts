import { create } from 'zustand'
import { DEFAULT_SETTINGS, loadProgress, saveProgress } from '@/lib/storage'
import type { SettingsSave } from '@/types/save'

interface SettingsState extends SettingsSave {
  hydrate: () => void
  setBgm: (v: number) => void
  setSfx: (v: number) => void
  setReduceParticles: (v: boolean) => void
  setGameSpeed: (v: 1 | 1.5 | 2) => void
}

function writeSettings(settings: SettingsSave) {
  const progress = loadProgress()
  saveProgress({ ...progress, settings })
}

function snapshot(state: SettingsState): SettingsSave {
  return {
    bgm: state.bgm,
    sfx: state.sfx,
    reduceParticles: state.reduceParticles,
    gameSpeed: state.gameSpeed,
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrate: () => {
    set(loadProgress().settings)
  },
  setBgm: (bgm) => {
    set({ bgm })
    writeSettings(snapshot(get()))
  },
  setSfx: (sfx) => {
    set({ sfx })
    writeSettings(snapshot(get()))
  },
  setReduceParticles: (reduceParticles) => {
    set({ reduceParticles })
    writeSettings(snapshot(get()))
  },
  setGameSpeed: (gameSpeed) => {
    set({ gameSpeed })
    writeSettings(snapshot(get()))
  },
}))
