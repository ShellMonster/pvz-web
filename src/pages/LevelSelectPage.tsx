import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LEVELS } from '@/data/levels'
import { getPlant } from '@/data/plants'
import { gamePath, getRouteById } from '@/routes/routeConfig'
import { useProgressStore } from '@/stores/progressStore'
import { CardPicker } from '@/components/game/CardPicker'
import { formatLevelId } from '@/lib/appMeta'

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
    <section
      data-testid={route.testId}
      className="flex h-full flex-col gap-3 overflow-auto rounded-lg p-2"
      style={{
        background:
          'linear-gradient(180deg, #b3e5fc 0%, #81c784 45%, #558b2f 100%)',
      }}
    >
      <div className="flex items-center justify-between rounded-xl border-2 border-[#6d4c41] bg-[#fff8e1]/95 px-4 py-2 shadow">
        <h2 className="text-xl font-black text-[#2e7d32]">{route.title}</h2>
        <Link
          to={getRouteById('home').path}
          className="text-sm font-bold text-[#5d4037] underline"
        >
          返回首页
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {LEVELS.map((lv, idx) => {
          const unlocked = isUnlocked(lv.id)
          const star = stars[lv.id] ?? 0
          return (
            <button
              key={lv.id}
              type="button"
              disabled={!unlocked}
              data-testid={`level-card-${lv.id}`}
              onClick={() => unlocked && start(lv.id)}
              className={[
                'relative flex flex-col items-start gap-1 rounded-xl border-4 p-3 text-left shadow-lg transition',
                unlocked
                  ? 'border-[#ffb300] bg-[#fffde7] hover:scale-[1.02] hover:brightness-105'
                  : 'cursor-not-allowed border-[#9e9e9e] bg-[#eceff1] opacity-70',
              ].join(' ')}
            >
              <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#ef6c00] text-sm font-black text-white shadow">
                {idx + 1}
              </div>
              <div className="mt-1 text-base font-black text-[#3e2723]">
                {formatLevelId(lv.id)} {lv.name}
              </div>
              <div className="text-xs text-[#6d4c41]">{lv.description}</div>
              <div className="mt-1 text-sm text-[#f9a825]">
                {'★'.repeat(star)}
                {'☆'.repeat(3 - star)}
              </div>
              <div className="mt-auto w-full rounded-md bg-[#8bc34a] py-1 text-center text-xs font-bold text-white">
                {!unlocked ? '锁定' : lv.freePick ? '选卡出战' : '进入关卡'}
              </div>
            </button>
          )
        })}
      </div>

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
