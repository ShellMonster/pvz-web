import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLANTS, PLANT_IDS } from '@/data/plants'
import { ZOMBIES, ZOMBIE_IDS } from '@/data/zombies'
import { getRouteById } from '@/routes/routeConfig'
import { useProgressStore } from '@/stores/progressStore'

export function CodexPage() {
  const route = getRouteById('codex')
  const hydrate = useProgressStore((s) => s.hydrate)
  const seen = useProgressStore((s) => s.seenCodex)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <section data-testid={route.testId} className="flex h-full flex-col gap-3 overflow-auto">
      <h2 className="text-2xl font-bold text-lime-50">{route.title}</h2>
      <Tabs defaultValue="plants">
        <TabsList>
          <TabsTrigger value="plants">植物</TabsTrigger>
          <TabsTrigger value="zombies">僵尸</TabsTrigger>
        </TabsList>
        <TabsContent value="plants">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLANT_IDS.map((id) => {
              const p = PLANTS[id]!
              const unlocked = seen.plants.includes(id)
              return (
                <Card key={id} data-testid={`codex-plant-${id}`}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">
                      {unlocked ? p.name : '???'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-emerald-200/80">
                    {unlocked ? p.description : '尚未发现'}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        <TabsContent value="zombies">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ZOMBIE_IDS.map((id) => {
              const z = ZOMBIES[id]!
              const unlocked = seen.zombies.includes(id)
              return (
                <Card key={id} data-testid={`codex-zombie-${id}`}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">
                      {unlocked ? z.name : '???'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-emerald-200/80">
                    {unlocked ? z.description : '尚未发现'}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
