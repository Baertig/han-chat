import { describe, it, expect } from 'vitest'
import { isPunctuation, matchTranslationsToText } from '@/services/translation-matcher'
import type { WordTranslation, AnnotatedWord } from '@/types'

// ── isPunctuation ────────────────────────────────────────

describe('isPunctuation', () => {
  it('recognises CJK punctuation', () => {
    for (const ch of ['。', '，', '！', '？', '、', '；', '：', '（', '）', '【', '】', '「', '」', '『', '』']) {
      expect(isPunctuation(ch), `expected "${ch}" to be punctuation`).toBe(true)
    }
  })

  it('recognises em-dash, ellipsis, and middle dot', () => {
    for (const ch of ['\u2014', '\u2026', '\u00B7']) {
      expect(isPunctuation(ch), `expected U+${ch.codePointAt(0)!.toString(16)} to be punctuation`).toBe(true)
    }
  })

  it('recognises fullwidth punctuation', () => {
    // Fullwidth ! and ? (U+FF01, U+FF1F)
    expect(isPunctuation('\uFF01')).toBe(true)
    expect(isPunctuation('\uFF1F')).toBe(true)
    // Fullwidth comma and period (U+FF0C, U+FF0E)
    expect(isPunctuation('\uFF0C')).toBe(true)
    expect(isPunctuation('\uFF0E')).toBe(true)
  })

  it('recognises ASCII punctuation', () => {
    for (const ch of ['.', ',', '!', '?', ';', ':', '(', ')', '[', ']', '{', '}', "'", '"', '-']) {
      expect(isPunctuation(ch), `expected "${ch}" to be punctuation`).toBe(true)
    }
  })

  it('recognises whitespace', () => {
    expect(isPunctuation(' ')).toBe(true)
    expect(isPunctuation('\t')).toBe(true)
    expect(isPunctuation('\n')).toBe(true)
  })

  it('returns false for Chinese characters', () => {
    for (const ch of ['你', '好', '学', '世', '界']) {
      expect(isPunctuation(ch), `expected "${ch}" NOT to be punctuation`).toBe(false)
    }
  })

  it('returns false for ASCII letters', () => {
    for (const ch of ['a', 'b', 'c', 'Z']) {
      expect(isPunctuation(ch), `expected "${ch}" NOT to be punctuation`).toBe(false)
    }
  })

  it('returns false for digits', () => {
    for (const ch of ['0', '5', '9']) {
      expect(isPunctuation(ch), `expected "${ch}" NOT to be punctuation`).toBe(false)
    }
  })
})

// ── matchTranslationsToText ──────────────────────────────

describe('matchTranslationsToText', () => {
  it('returns an empty array for empty text', () => {
    const result = matchTranslationsToText('', [])
    expect(result).toEqual([])
  })

  it('matches exact consecutive tokens', () => {
    const tokens: WordTranslation[] = [
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ]
    const result = matchTranslationsToText('你好世界', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ])
  })

  it('inserts punctuation with null pinyin and translation', () => {
    const tokens: WordTranslation[] = [
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ]
    const result = matchTranslationsToText('你好，世界', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '，', pinyin: null, translation: null },
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ])
  })

  it('handles unmatched characters with null annotations', () => {
    const tokens: WordTranslation[] = [
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
    ]
    // "啊" is not in the token list
    const result = matchTranslationsToText('你好啊', tokens)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual<AnnotatedWord>({ word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' })
    expect(result[1]).toEqual<AnnotatedWord>({ word: '啊', pinyin: null, translation: null })
  })

  it('skips the first token when the second token matches (LLM double-word skip)', () => {
    // LLM returned a spurious first token that doesn't appear in the text
    const tokens: WordTranslation[] = [
      { word: '错误', pinyin: 'cuò wù', translation: 'error' },    // does NOT match text at position 0
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },    // DOES match text at position 0
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ]
    const result = matchTranslationsToText('你好世界', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ])
  })

  it('handles mixed content with punctuation, matches, and unmatched chars', () => {
    const tokens: WordTranslation[] = [
      { word: '我', pinyin: 'wǒ', translation: 'I' },
      { word: '很', pinyin: 'hěn', translation: 'very' },
      { word: '高兴', pinyin: 'gāo xìng', translation: 'happy' },
      { word: '认识', pinyin: 'rèn shi', translation: 'to know' },
      { word: '你', pinyin: 'nǐ', translation: 'you' },
    ]
    const result = matchTranslationsToText('我很高兴认识你。', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '我', pinyin: 'wǒ', translation: 'I' },
      { word: '很', pinyin: 'hěn', translation: 'very' },
      { word: '高兴', pinyin: 'gāo xìng', translation: 'happy' },
      { word: '认识', pinyin: 'rèn shi', translation: 'to know' },
      { word: '你', pinyin: 'nǐ', translation: 'you' },
      { word: '。', pinyin: null, translation: null },
    ])
  })

  it('handles text that is entirely punctuation', () => {
    const result = matchTranslationsToText('。，！', [])

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '。', pinyin: null, translation: null },
      { word: '，', pinyin: null, translation: null },
      { word: '！', pinyin: null, translation: null },
    ])
  })

  it('handles text with no matching tokens at all', () => {
    const tokens: WordTranslation[] = [
      { word: '完全不同', pinyin: 'wán quán bù tóng', translation: 'completely different' },
    ]
    const result = matchTranslationsToText('你好', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '你', pinyin: null, translation: null },
      { word: '好', pinyin: null, translation: null },
    ])
  })

  it('handles punctuation token in the queue that matches text punctuation', () => {
    // LLM sometimes includes punctuation as a "word" in the token list
    const tokens: WordTranslation[] = [
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '，', pinyin: '', translation: 'comma' },
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ]
    const result = matchTranslationsToText('你好，世界', tokens)

    // Punctuation still gets null annotations; the queue token is consumed
    expect(result).toEqual<AnnotatedWord[]>([
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '，', pinyin: null, translation: null },
      { word: '世界', pinyin: 'shì jiè', translation: 'world' },
    ])
  })

  it('handles multiple consecutive punctuation marks', () => {
    const tokens: WordTranslation[] = [
      { word: '什么', pinyin: 'shén me', translation: 'what' },
    ]
    const result = matchTranslationsToText('什么？！', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '什么', pinyin: 'shén me', translation: 'what' },
      { word: '？', pinyin: null, translation: null },
      { word: '！', pinyin: null, translation: null },
    ])
  })

  it('does not mutate the original tokens array', () => {
    const tokens: WordTranslation[] = [
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
    ]
    const originalTokens = [...tokens]
    matchTranslationsToText('你好', tokens)

    expect(tokens).toEqual(originalTokens)
  })

  it('handles single-character words', () => {
    const tokens: WordTranslation[] = [
      { word: '我', pinyin: 'wǒ', translation: 'I' },
      { word: '好', pinyin: 'hǎo', translation: 'good' },
    ]
    const result = matchTranslationsToText('我好', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '我', pinyin: 'wǒ', translation: 'I' },
      { word: '好', pinyin: 'hǎo', translation: 'good' },
    ])
  })

  it('handles spaces in text as punctuation', () => {
    const tokens: WordTranslation[] = [
      { word: '你', pinyin: 'nǐ', translation: 'you' },
      { word: '好', pinyin: 'hǎo', translation: 'good' },
    ]
    const result = matchTranslationsToText('你 好', tokens)

    expect(result).toEqual<AnnotatedWord[]>([
      { word: '你', pinyin: 'nǐ', translation: 'you' },
      { word: ' ', pinyin: null, translation: null },
      { word: '好', pinyin: 'hǎo', translation: 'good' },
    ])
  })
})
