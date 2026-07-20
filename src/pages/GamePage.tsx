import { Link, useParams } from 'react-router-dom'
import { getRouteById } from '@/routes/routeConfig'

export function GamePage() {
  const route = getRouteById('game')
  const { levelId } = useParams<{ levelId: string }>()
  const resolvedId = levelId ?? 'unknown'

  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-3">
      <h2 className="text-2xl font-bold text-lime-50">{route.title}</h2>
      <p className="text-emerald-100">
        关卡：<span data-testid="game-level-id">{resolvedId}</span>
      </p>
      <p className="text-sm text-emerald-200/70">
        占位战场 · Phaser 接入见 PR-006 · 可玩战斗见 PR-009
      </p>
      <Link
        to={getRouteById('levels').path}
        className="w-fit text-sm text-lime-300 underline-offset-2 hover:underline"
      >
        返回选关
      </Link>
    </section>
  )
}
