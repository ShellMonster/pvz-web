import { Link } from 'react-router-dom'
import { APP_TAGLINE } from '@/lib/appMeta'
import { gamePath, getRouteById } from '@/routes/routeConfig'

export function HomePage() {
  const route = getRouteById('home')
  return (
    <section data-testid={route.testId} className="flex h-full flex-col justify-center gap-4">
      <h2 className="text-2xl font-bold text-lime-50 sm:text-3xl">{route.title}</h2>
      <p className="text-emerald-100/80">{APP_TAGLINE}</p>
      <p className="text-sm text-emerald-200/70">占位页 · PR-002 · 后续接入进度与继续游戏</p>
      <div className="flex flex-wrap gap-3">
        <Link
          to={getRouteById('levels').path}
          className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-500"
        >
          开始游戏
        </Link>
        <Link
          to={gamePath('1-1')}
          className="rounded-lg border border-emerald-600 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-900/50"
        >
          快速进入 1-1
        </Link>
      </div>
    </section>
  )
}
