import Phaser from 'phaser'
import type { BattleEngine } from '@/game/logic/battleEngine'
import { BattleScene } from '@/game/scenes/BattleScene'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/data/balance'

export interface CreateGameOptions {
  parent: HTMLElement
  engine: BattleEngine
  onSnapshot?: () => void
}

export function createBattleGame(opts: CreateGameOptions): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    parent: opts.parent,
    backgroundColor: '#1a3d1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
    banner: false,
  })

  const scene = new BattleScene(opts.engine, opts.onSnapshot)
  game.scene.add('battle', scene, true)
  return game
}
