import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getLevel } from '@/data/levels'
import { getPlant } from '@/data/plants'
import {
  BattleEngine,
  calcStars,
  type BattleSnapshot,
} from '@/game/logic/battleEngine'
import { loadAssets, startCanvasBattle } from '@/game/canvasRenderer'
import { getRouteById } from '@/routes/routeConfig'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { playSfx } from '@/lib/audio'

export function GamePage() {
  const route = getRouteById('game')
  const { levelId = '1-1' } = useParams<{ levelId: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const hydrateProgress = useProgressStore((s) => s.hydrate)
  const recordWin = useProgressStore((s) => s.recordWin)
  const unlockSeenPlant = useProgressStore((s) => s.unlockSeenPlant)
  const unlockSeenZombie = useProgressStore((s) => s.unlockSeenZombie)
  const hydrateSettings = useSettingsStore((s) => s.hydrate)
  const gameSpeed = useSettingsStore((s) => s.gameSpeed)
  const setGameSpeed = useSettingsStore((s) => s.setGameSpeed)

  const level = useMemo(() => getLevel(levelId), [levelId])
  const loadout = useMemo(() => {
    const q = params.get('cards')
    if (q) return q.split(',').filter(Boolean)
    if (level.presetCards) return [...level.presetCards]
    return level.plantIds.slice(0, level.cardSlots)
  }, [level, params])

  const initialSpeedRef = useRef(gameSpeed)
  const engine = useMemo(() => {
    const e = new BattleEngine({ level, loadout })
    e.setSpeed(initialSpeedRef.current)
    return e
  }, [level, loadout])

  const engineRef = useRef(engine)
  engineRef.current = engine

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snap, setSnap] = useState<BattleSnapshot>(() => engine.snapshot())
  const [paused, setPaused] = useState(false)
  const settled = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrateProgress()
    hydrateSettings()
  }, [hydrateProgress, hydrateSettings])

  useEffect(() => {
    for (const id of loadout) unlockSeenPlant(id)
  }, [loadout, unlockSeenPlant])

  useEffect(() => {
    settled.current = false
    setPaused(false)
    setSnap(engine.snapshot())
    setReady(false)
  }, [engine])

  // Canvas battle: empty canvas element only — no React children inside.
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let destroyed = false
    let handle: { destroy: () => void } | null = null

    void (async () => {
      const assets = await loadAssets()
      if (destroyed || !canvasRef.current) return
      handle = startCanvasBattle({
        canvas: canvasRef.current,
        engine,
        assets,
        onUi: () => {
          const s = engine.snapshot()
          setSnap({ ...s })
          for (const z of s.zombies) unlockSeenZombie(z.zombieId)
          if (!settled.current && s.status === 'won') {
            settled.current = true
            recordWin(level.id, calcStars(s, s.sun))
            playSfx('win')
          }
          if (!settled.current && s.status === 'lost') {
            settled.current = true
            playSfx('lose')
          }
        },
      })
      if (!destroyed) setReady(true)
    })()

    return () => {
      destroyed = true
      handle?.destroy()
    }
  }, [engine, level.id, recordWin, unlockSeenZombie])

  useEffect(() => {
    engineRef.current.setSpeed(gameSpeed)
  }, [gameSpeed])

  useEffect(() => {
    engineRef.current.setPaused(paused)
  }, [paused])

  const select = (id: string) => {
    engineRef.current.selectPlant(id)
    setSnap(engineRef.current.snapshot())
    playSfx('select')
  }

  const wavePct =
    snap.totalWaves === 0
      ? 0
      : Math.round((snap.waveIndex / snap.totalWaves) * 100)

  return (
    <section
      data-testid={route.testId}
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-[#3d6b1f]"
    >
      {/* Top bar — PvZ seed bank style */}
      <div className="z-10 flex shrink-0 items-stretch gap-2 border-b-4 border-[#5d4037] bg-gradient-to-b from-[#c8e6a0] to-[#8fbc5a] px-2 py-1 shadow-md">
        {/* Sun bank */}
        <div
          className="flex min-w-[88px] flex-col items-center justify-center rounded-md border-2 border-[#b8860b] bg-gradient-to-b from-[#fff59d] to-[#fbc02d] px-2 py-1 shadow"
          data-testid="sun-count"
        >
          <img
            src="/assets/ui/sun.png"
            alt=""
            className="h-9 w-9 object-contain"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <span className="text-lg font-black text-[#5d4037]">{snap.sun}</span>
        </div>

        {/* Seed packets */}
        <div className="flex flex-1 gap-1 overflow-x-auto py-0.5">
          {loadout.map((id) => {
            const def = getPlant(id)
            const cd = engineRef.current.cooldowns[id] ?? 0
            const selected = snap.selectedPlantId === id
            const disabled = snap.sun < def.sunCost || cd > 0
            return (
              <button
                key={id}
                type="button"
                data-testid={`card-${id}`}
                disabled={disabled && !selected}
                onClick={() => select(id)}
                className={[
                  'relative flex h-[72px] w-[58px] shrink-0 flex-col items-center overflow-hidden rounded border-2 bg-[#f5e6c8] shadow',
                  selected
                    ? 'border-yellow-300 ring-2 ring-yellow-200'
                    : 'border-[#6d4c41]',
                  disabled ? 'opacity-55' : 'hover:brightness-105',
                ].join(' ')}
              >
                <img
                  src={def.sprite}
                  alt=""
                  className="mt-1 h-9 w-9 object-contain"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                  }}
                />
                <span className="px-0.5 text-center text-[10px] font-bold leading-tight text-[#3e2723]">
                  {def.name}
                </span>
                <span className="mt-auto w-full bg-[#fff59d] text-center text-[11px] font-black text-[#5d4037]">
                  {def.sunCost}
                </span>
                {cd > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-bold text-white">
                    {cd.toFixed(1)}s
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col justify-center gap-1">
          <div className="text-[11px] font-bold text-[#1b5e20]">
            <span data-testid="game-level-id">{levelId}</span>
            {' · '}
            {level.name} · 波次 {snap.waveIndex}/{snap.totalWaves}
          </div>
          <div className="h-2 w-28 overflow-hidden rounded bg-[#2e7d32]/60">
            <div
              className="h-full bg-[#ffeb3b] transition-all"
              style={{ width: `${wavePct}%` }}
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 bg-[#efebe9] text-[#3e2723]"
              onClick={() => setPaused(true)}
            >
              暂停
            </Button>
            {([1, 1.5, 2] as const).map((r) => (
              <Button
                key={r}
                size="sm"
                className={`h-7 px-2 ${
                  gameSpeed === r
                    ? 'bg-[#ff8f00] text-white'
                    : 'bg-[#efebe9] text-[#3e2723]'
                }`}
                onClick={() => setGameSpeed(r)}
              >
                ×{r}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {snap.toast && (
        <p
          className="pointer-events-none absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded bg-red-900/80 px-4 py-2 text-sm font-bold text-yellow-100 shadow"
          data-testid="battle-toast"
        >
          {snap.toast}
        </p>
      )}

      {/* Battlefield — canvas only host, no React children inside canvas */}
      <div
        data-testid="battle-canvas-host"
        data-phaser-ready={ready ? 'true' : 'false'}
        className="relative min-h-0 flex-1 bg-[#5d8a3e]"
      >
        {!ready && (
          <p className="absolute inset-0 z-[1] flex items-center justify-center text-sm font-bold text-white/90">
            战场加载中…
          </p>
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>

      <div className="flex shrink-0 items-center justify-between bg-[#5d4037] px-3 py-1 text-[11px] text-[#ffe0b2]">
        <Link to={getRouteById('levels').path} className="underline">
          返回选关
        </Link>
        <span>选种子包 → 点草地种植 · 点阳光收集 · 守住房子</span>
        <button
          type="button"
          className="underline"
          onClick={() => {
            engineRef.current.collectAllSun()
            setSnap(engineRef.current.snapshot())
          }}
        >
          一键收阳光
        </button>
      </div>

      <Dialog open={paused && snap.status === 'playing'} onOpenChange={setPaused}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>暂停</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setPaused(false)}>继续</Button>
            <Button
              variant="secondary"
              onClick={() => navigate(getRouteById('levels').path)}
            >
              退出到选关
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={snap.status === 'won' || snap.status === 'lost'}>
        <DialogContent data-testid="result-dialog">
          <DialogHeader>
            <DialogTitle>
              {snap.status === 'won' ? '胜利！' : '失败…'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-emerald-100">
            {snap.status === 'won'
              ? `星级 ${calcStars(snap, snap.sun)} · 剩余阳光 ${snap.sun}`
              : snap.loseReason}
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate(0)}>重开</Button>
            <Button
              variant="secondary"
              onClick={() => navigate(getRouteById('levels').path)}
            >
              选关
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
