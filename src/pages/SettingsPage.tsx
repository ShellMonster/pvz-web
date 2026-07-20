import { getRouteById } from '@/routes/routeConfig'

export function SettingsPage() {
  const route = getRouteById('settings')
  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-3">
      <h2 className="text-2xl font-bold text-lime-50">{route.title}</h2>
      <p className="text-sm text-emerald-200/70">占位设置 · 音量/重置进度见 PR-004 / PR-019</p>
    </section>
  )
}
