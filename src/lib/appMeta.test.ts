import { describe, expect, it } from 'vitest'
import { APP_TITLE, DESIGN_ASPECT, formatShellLabel } from '@/lib/appMeta'

describe('appMeta', () => {
  it('exposes product title and landscape aspect', () => {
    expect(APP_TITLE).toBe('植物大战僵尸')
    expect(DESIGN_ASPECT).toBe('16:9')
  })

  it('formatShellLabel combines title with design aspect', () => {
    expect(formatShellLabel()).toBe('植物大战僵尸 · 16:9')
    expect(formatShellLabel('测试')).toBe('测试 · 16:9')
  })
})
