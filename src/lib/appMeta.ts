/** Product metadata used by shell UI and smoke tests. */
export const APP_TITLE = '植物大战僵尸'
export const APP_TAGLINE = '横屏塔防 · 本地进度 · 无登录'
export const DESIGN_ASPECT = '16:9' as const

export function formatShellLabel(title: string = APP_TITLE): string {
  return `${title} · ${DESIGN_ASPECT}`
}
