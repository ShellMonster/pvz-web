import { Navigate, Route, Routes } from 'react-router-dom'
import {
  LandscapeShell,
  type ShellFrame,
} from '@/components/layout/LandscapeShell'
import { CodexPage } from '@/pages/CodexPage'
import { GamePage } from '@/pages/GamePage'
import { HomePage } from '@/pages/HomePage'
import { LevelSelectPage } from '@/pages/LevelSelectPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { getRouteById } from '@/routes/routeConfig'

export interface AppRoutesProps {
  /** Injected shell size for letterbox tests (production omits this). */
  shellFrame?: ShellFrame
}

/**
 * Route tree without a Router provider — use BrowserRouter in production
 * and MemoryRouter in tests.
 */
export function AppRoutes({ shellFrame }: AppRoutesProps = {}) {
  const home = getRouteById('home')
  const levels = getRouteById('levels')
  const game = getRouteById('game')
  const codex = getRouteById('codex')
  const settings = getRouteById('settings')

  return (
    <Routes>
      <Route element={<LandscapeShell frame={shellFrame} />}>
        <Route path={home.path} element={<HomePage />} />
        <Route path={levels.path} element={<LevelSelectPage />} />
        <Route path={game.path} element={<GamePage />} />
        <Route path={codex.path} element={<CodexPage />} />
        <Route path={settings.path} element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={home.path} replace />} />
      </Route>
    </Routes>
  )
}
