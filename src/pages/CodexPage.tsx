import { getRouteById } from '@/routes/routeConfig'

export function CodexPage() {
  const route = getRouteById('codex')
  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-3">
      <h2 className="text-2xl font-bold text-lime-50">{route.title}</h2>
      <p className="text-sm text-emerald-200/70">占位图鉴 · 完整解锁见 PR-018</p>
    </section>
  )
}
