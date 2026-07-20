import { describe, expect, it } from 'vitest'
import { requireRoot } from '@/lib/requireRoot'

describe('requireRoot', () => {
  it('returns the #root element when present', () => {
    const root = document.createElement('div')
    root.id = 'root'
    const doc = {
      getElementById: (id: string) => (id === 'root' ? root : null),
    }
    expect(requireRoot(doc)).toBe(root)
  })

  it('throws when #root is missing', () => {
    const doc = { getElementById: () => null }
    expect(() => requireRoot(doc)).toThrow(/#root not found/)
  })
})
