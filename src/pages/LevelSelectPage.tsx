import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LEVELS } from '@/data/levels'
import { getPlant } from '@/data/plants'
import { gamePath, getRouteById } from '@/routes/routeConfig'
import { useProgressStore } from '@/stores/progressStore'
import { CardPicker } from '@/components/game/CardPicker'

export function LevelSelectPage() {
  const route = getRouteById('levels')
  const hydrate = useProgressStore((s) => s.hydrate)
  const isUnlocked = useProgressStore((s) => s.isUnlocked)
  const stars = useProgressStore((s) => s.stars)
  const navigate = useNavigate()
  const [pickLevel, setPickLevel] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const start = (levelId: string, cards?: string[]) => {
    const level = LEVELS.find((l) => l.id === levelId)!
    if (level.freePick) {
      if (!cards) {
        setPickLevel(levelId)
        return
      }
      navigate(`${gamePath(levelId)}?cards=${cards.join(',')}`)
    } else {
      navigate(gamePath(levelId))
    }
  }

  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-3 overflow-auto">
      <h2 className="text-2xl font-bold text-lime-50">{route.title}</h2>
      <p className="text-sm text-emerald-200/70">选择关卡 · 通关解锁下一关</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {LEVELS.map((lv) => {
          const unlocked = isUnlocked(lv.id)
          const star = stars[lv.id] ?? 0
          return (
            <Card
              key={lv.id}
              className={!unlocked ? 'opacity-50' : ''}
              data-testid={`level-card-${lv.id}`}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-base">
                  {lv.id} {lv.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0 text-xs">
                <p className="text-emerald-200/80">{lv.description}</p>
                <div className="flex items-center gap-2">
                  <Badge>{'★'.repeat(star)}{'☆'.repeat(3 - star)}</Badge>
                  {!unlocked && <span>锁定</span>}
                </div>
                <Button
                  size="sm"
                  disabled={!unlocked}
                  onClick={() => start(lv.id)}
                  className="w-full"
                >
                  {lv.freePick ? '选卡出战' : '进入'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Button variant="ghost" asChild className="w-fit">
        <Link to={getRouteById('home').path}>返回首页</Link>
      </Button>

      {pickLevel && (
        <CardPicker
          levelId={pickLevel}
          open={!!pickLevel}
          onClose={() => setPickLevel(null)}
          onConfirm={(cards) => {
            const id = pickLevel
            setPickLevel(null)
            start(id, cards)
          }}
          plantIds={LEVELS.find((l) => l.id === pickLevel)!.plantIds}
          slots={LEVELS.find((l) => l.id === pickLevel)!.cardSlots}
          plantName={(id) => getPlant(id).name}
        />
      )}
    </section>
  )
}
