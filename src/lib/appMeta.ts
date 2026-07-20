/** Product metadata used by shell UI and smoke tests. */
export const APP_TITLE = '植物大战僵尸'
export const APP_TAGLINE = '横屏塔防 · 本地进度 · 无需登录'
/** Technical landscape ratio (not shown to users as-is). */
export const DESIGN_ASPECT = '16:9' as const
/** User-facing shell subtitle. */
export const APP_SHELL_SUBTITLE = '横屏版'

export function formatShellLabel(title: string = APP_TITLE): string {
  return `${title} · ${APP_SHELL_SUBTITLE}`
}

/** Display level id like 1-1 as 关卡 1-1 for UI. */
export function formatLevelId(levelId: string): string {
  return `关卡 ${levelId}`
}
