import { describe, it, expect } from 'vitest'

describe('image-resize', () => {
  it('exports resizeImage function', async () => {
    const mod = await import('@/services/image-resize')
    expect(mod.resizeImage).toBeTypeOf('function')
  })
})
