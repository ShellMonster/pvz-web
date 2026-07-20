import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { getRouteById } from '@/routes/routeConfig'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function SettingsPage() {
  const route = getRouteById('settings')
  const hydrate = useSettingsStore((s) => s.hydrate)
  const bgm = useSettingsStore((s) => s.bgm)
  const sfx = useSettingsStore((s) => s.sfx)
  const reduceParticles = useSettingsStore((s) => s.reduceParticles)
  const gameSpeed = useSettingsStore((s) => s.gameSpeed)
  const setBgm = useSettingsStore((s) => s.setBgm)
  const setSfx = useSettingsStore((s) => s.setSfx)
  const setReduceParticles = useSettingsStore((s) => s.setReduceParticles)
  const setGameSpeed = useSettingsStore((s) => s.setGameSpeed)
  const resetProgress = useProgressStore((s) => s.resetProgress)
  const hydrateProgress = useProgressStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    hydrateProgress()
  }, [hydrate, hydrateProgress])

  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-3 overflow-auto">
      <h2 className="text-2xl font-bold text-lime-50">{route.title}</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">音量</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 text-sm">
              背景音乐 {Math.round(bgm * 100)}%
            </div>
            <Slider
              data-testid="slider-bgm"
              min={0}
              max={1}
              step={0.05}
              value={[bgm]}
              onValueChange={(v) => setBgm(v[0] ?? 0)}
            />
          </div>
          <div>
            <div className="mb-1 text-sm">音效 {Math.round(sfx * 100)}%</div>
            <Slider
              data-testid="slider-sfx"
              min={0}
              max={1}
              step={0.05}
              value={[sfx]}
              onValueChange={(v) => setSfx(v[0] ?? 0)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">画面与速度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>减少粒子</span>
            <Switch
              data-testid="switch-particles"
              checked={reduceParticles}
              onCheckedChange={setReduceParticles}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-emerald-100/80">游戏速度</span>
            {([1, 1.5, 2] as const).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={gameSpeed === r ? 'default' : 'outline'}
                onClick={() => setGameSpeed(r)}
              >
                {r} 倍速
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">进度</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            data-testid="reset-progress"
            onClick={() => {
              if (confirm('确定重置全部本地进度？')) resetProgress()
            }}
          >
            重置进度
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
