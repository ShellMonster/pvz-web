import { useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    <section
      data-testid={route.testId}
      className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-lg"
      style={{
        background:
          'linear-gradient(180deg, #87CEEB 0%, #87CEEB 38%, #7EC850 38%, #3D8B37 100%)',
      }}
    >
      {/* decorative lawn strip */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[repeating-linear-gradient(90deg,#4caf50_0_40px,#66bb6a_40px_80px)] opacity-40" />

      <img
        src="/assets/ui/sun.png"
        alt=""
        className="absolute left-8 top-8 h-14 w-14 animate-pulse object-contain drop-shadow"
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />

      <div className="relative z-[1] flex max-w-lg flex-col items-center gap-4 rounded-2xl border-4 border-[#6d4c41] bg-[#fff8e1]/95 px-10 py-8 shadow-2xl">
        <h2 className="text-center text-4xl font-black tracking-wide text-[#2e7d32] drop-shadow-sm sm:text-5xl">
          {APP_TITLE}
        </h2>
        <p className="text-center text-sm font-semibold text-[#5d4037]">{APP_TAGLINE}</p>
        <p className="text-xs text-[#6d4c41]">
          进度：已解锁至 <span className="font-bold text-[#ef6c00]">{unlocked}</span>
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <Link
            to={getRouteById('levels').path}
            className="rounded-xl border-b-4 border-[#ef6c00] bg-[#ffb300] px-6 py-3 text-center text-lg font-black text-[#3e2723] shadow hover:brightness-105 active:translate-y-0.5 active:border-b-2"
          >
            开始冒险
          </Link>
          <Link
            to={gamePath(unlocked)}
            className="rounded-xl border-b-4 border-[#2e7d32] bg-[#8bc34a] px-6 py-2.5 text-center text-base font-bold text-white shadow hover:brightness-105"
          >
            继续 {unlocked}
          </Link>
          <div className="flex gap-2">
            <Link
              to={getRouteById('codex').path}
              className="flex-1 rounded-lg bg-[#efebe9] px-3 py-2 text-center text-sm font-bold text-[#5d4037]"
            >
              图鉴
            </Link>
            <Link
              to={getRouteById('settings').path}
              className="flex-1 rounded-lg bg-[#efebe9] px-3 py-2 text-center text-sm font-bold text-[#5d4037]"
            >
              设置
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
