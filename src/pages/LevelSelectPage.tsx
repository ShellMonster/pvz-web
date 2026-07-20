import { Link } from 'react-router-dom'
import { gamePath, getRouteById } from '@/routes/routeConfig'

const PLACEHOLDER_LEVELS = ['1-1', '1-2', '1-3'] as const

export function LevelSelectPage() {
  const route = getRouteById('levels')
  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-4">
      <h2 className="text-2xl font-bold text-lime-50">{route.title}</h2>
      <p className="text-sm text-emerald-200/70">占位关卡列表 · 解锁逻辑在 PR-004 / PR-016</p>
      <ul className="grid grid-cols-3 gap-3 sm:max-w-md">
        {PLACEHOLDER_LEVELS.map((id) => (
          <li key={id}>
            <Link
              to={gamePath(id)}
              className="flex aspect-video items-center justify-center rounded-lg border border-emerald-700 bg-emerald-950/80 text-lime-100 hover:border-lime-500"
            >
              {id}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
