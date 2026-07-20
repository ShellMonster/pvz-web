import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { getLevel } from '@/data/levels'
import { getPlant } from '@/data/plants'
import {
  BattleEngine,
  calcStars,
  type BattleSnapshot,
} from '@/game/logic/battleEngine'
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

  const engineRef = useRef<BattleEngine | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [snap, setSnap] = useState<BattleSnapshot | null>(null)
  const [paused, setPaused] = useState(false)
  const settled = useRef(false)
  // Read speed only at mount; mid-fight changes go through setSpeed effect.
  const initialSpeedRef = useRef(gameSpeed)

  useEffect(() => {
    hydrateProgress()
    hydrateSettings()
  }, [hydrateProgress, hydrateSettings])

  useEffect(() => {
    for (const id of loadout) unlockSeenPlant(id)
  }, [loadout, unlockSeenPlant])

  useEffect(() => {
    const engine = new BattleEngine({ level, loadout })
    engine.setSpeed(initialSpeedRef.current)
    engineRef.current = engine
    setSnap(engine.snapshot())
    settled.current = false

    if (!hostRef.current) return
    let destroyed = false
    let game: { destroy: (removeCanvas: boolean) => void } | null = null

    // Dynamic import so Vitest/jsdom routes tests never load Phaser at module init.
    void import('@/game/createGame').then(({ createBattleGame }) => {
      if (destroyed || !hostRef.current) return
      game = createBattleGame({
        parent: hostRef.current,
        engine,
        onSnapshot: () => {
          const s = engine.snapshot()
          setSnap({ ...s })
          for (const z of s.zombies) unlockSeenZombie(z.zombieId)
          if (!settled.current && s.status === 'won') {
            settled.current = true
            const stars = calcStars(s, s.sun)
            recordWin(level.id, stars)
            playSfx('win')
          }
          if (!settled.current && s.status === 'lost') {
            settled.current = true
            playSfx('lose')
          }
        },
      })
    })

    return () => {
      destroyed = true
      if (game) game.destroy(true)
      engineRef.current = null
    }
    // Intentionally omit gameSpeed: mid-fight speed must not remount Phaser.
  }, [level, loadout, recordWin, unlockSeenZombie])

  useEffect(() => {
    engineRef.current?.setSpeed(gameSpeed)
  }, [gameSpeed])

  useEffect(() => {
    engineRef.current?.setPaused(paused)
  }, [paused])

  const select = (id: string) => {
    engineRef.current?.selectPlant(id)
    setSnap(engineRef.current?.snapshot() ?? null)
    playSfx('select')
  }

  if (!snap) {
    return (
      <section data-testid={route.testId}>
        <p>加载战场…</p>
      </section>
    )
  }

  const wavePct =
    snap.totalWaves === 0
      ? 0
      : Math.round((snap.waveIndex / snap.totalWaves) * 100)

  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button variant="secondary" size="sm" onClick={() => setPaused(true)}>
          暂停
        </Button>
        <span className="font-semibold text-lime-100">{level.name}</span>
        <span data-testid="game-level-id" className="text-emerald-200">
          {levelId}
        </span>
        <span className="rounded bg-yellow-600/80 px-2 py-0.5 text-black" data-testid="sun-count">
          ☀ {snap.sun}
        </span>
        <span className="text-emerald-200">
          波次 {snap.waveIndex}/{snap.totalWaves}
        </span>
        <div className="ml-auto flex gap-1">
          {([1, 1.5, 2] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={gameSpeed === r ? 'default' : 'outline'}
              onClick={() => setGameSpeed(r)}
            >
              ×{r}
            </Button>
          ))}
        </div>
      </div>
      <Progress value={wavePct} className="h-1.5" />
      {snap.toast && (
        <p className="text-center text-sm text-amber-200" data-testid="battle-toast">
          {snap.toast}
        </p>
      )}
      <div className="flex min-h-0 flex-1 gap-2">
        <Card className="w-28 shrink-0 overflow-auto">
          <CardContent className="flex flex-col gap-2 p-2">
            {loadout.map((id) => {
              const def = getPlant(id)
              const cd = engineRef.current?.cooldowns[id] ?? 0
              const selected = snap.selectedPlantId === id
              const disabled = snap.sun < def.sunCost || cd > 0
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={`card-${id}`}
                  disabled={disabled && !selected}
                  onClick={() => select(id)}
                  className={`rounded border p-1 text-left text-xs ${
                    selected
                      ? 'border-lime-400 bg-lime-800'
                      : 'border-emerald-700 bg-emerald-950'
                  } ${disabled ? 'opacity-50' : ''}`}
                >
                  <div className="font-medium">{def.name}</div>
                  <div>☀{def.sunCost}</div>
                  {cd > 0 && <div>CD {cd.toFixed(1)}s</div>}
                </button>
              )
            })}
            <Button size="sm" variant="ghost" onClick={() => engineRef.current?.collectAllSun()}>
              收阳光
            </Button>
          </CardContent>
        </Card>
        <div
          ref={hostRef}
          data-testid="battle-canvas-host"
          className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-emerald-800 bg-black"
        />
      </div>
      <div className="flex gap-2 text-xs text-emerald-200/80">
        <Link to={getRouteById('levels').path} className="underline">
          返回选关
        </Link>
        <span>点卡片选植物，再点草地格子种植；点金色阳光收集</span>
      </div>

      <Dialog open={paused && snap.status === 'playing'} onOpenChange={setPaused}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>暂停</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setPaused(false)}>继续</Button>
            <Button variant="secondary" onClick={() => navigate(getRouteById('levels').path)}>
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
            <Button variant="secondary" onClick={() => navigate(getRouteById('levels').path)}>
              选关
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
