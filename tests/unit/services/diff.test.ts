import { describe, it, expect } from 'vitest'
import { computeDiff } from '@/services/diff'

describe('computeDiff', () => {
  it('returns a single equal segment for identical strings', () => {
    const result = computeDiff('hello', 'hello')

    expect(result).toEqual([{ value: 'hello', type: 'equal' }])
  })

  it('detects added characters', () => {
    const result = computeDiff('abc', 'abcd')

    expect(result).toEqual([
      { value: 'abc', type: 'equal' },
      { value: 'd', type: 'added' },
    ])
  })

  it('detects removed characters', () => {
    const result = computeDiff('abcd', 'abc')

    expect(result).toEqual([
      { value: 'abc', type: 'equal' },
      { value: 'd', type: 'removed' },
    ])
  })

  it('handles Chinese character diffs correctly', () => {
    const result = computeDiff('我喜欢吃饭', '我喜欢吃面')

    expect(result).toEqual([
      { value: '我喜欢吃', type: 'equal' },
      { value: '饭', type: 'removed' },
      { value: '面', type: 'added' },
    ])
  })

  it('handles complete replacement', () => {
    const result = computeDiff('ABC', 'XYZ')

    expect(result).toEqual([
      { value: 'ABC', type: 'removed' },
      { value: 'XYZ', type: 'added' },
    ])
  })
})
