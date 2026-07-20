import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { APP_TAGLINE, APP_TITLE } from '@/lib/appMeta'
import { gamePath, getRouteById } from '@/routes/routeConfig'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function HomePage() {
  const route = getRouteById('home')
  const hydrate = useProgressStore((s) => s.hydrate)
  const unlocked = useProgressStore((s) => s.unlockedLevelId)
  const hydrateSettings = useSettingsStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    hydrateSettings()
  }, [hydrate, hydrateSettings])

  return (
    <section data-testid={route.testId} className="flex h-full flex-col justify-center gap-4">
      <h2 className="text-3xl font-bold text-lime-50">{APP_TITLE}</h2>
      <p className="text-emerald-100/80">{APP_TAGLINE}</p>
      <p className="text-sm text-emerald-200/70">
        进度已解锁至 <span className="text-lime-300">{unlocked}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={getRouteById('levels').path}>开始游戏</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to={gamePath(unlocked)}>继续 {unlocked}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={getRouteById('codex').path}>图鉴</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to={getRouteById('settings').path}>设置</Link>
        </Button>
      </div>
    </section>
  )
}
