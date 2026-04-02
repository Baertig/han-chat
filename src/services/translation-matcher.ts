import type { WordTranslation, AnnotatedWord } from '@/types'

/**
 * Returns true for CJK punctuation, ASCII punctuation, and whitespace.
 */
export function isPunctuation(char: string): boolean {
  // CJK punctuation & symbols
  if (/[\u3000-\u303F]/.test(char)) return true
  // Fullwidth forms (！ ？ ， ． etc.)
  if (/[\uFF00-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65]/.test(char)) return true
  // CJK compatibility / misc symbols that act as punctuation
  if (/[\u2014\u2026\u00B7]/.test(char)) return true
  // ASCII punctuation and whitespace
  if (/^[.,!?;:()\[\]{}'"\-\s]$/.test(char)) return true
  return false
}

/**
 * Aligns LLM-produced word translations against the original text,
 * producing one AnnotatedWord per visual unit (word or punctuation).
 *
 * Handles mismatches gracefully:
 * - Punctuation is always emitted with null pinyin/translation.
 * - If the first queued token doesn't match but the second does, the first
 *   is skipped (common LLM tokenisation artefact).
 * - Unmatched characters fall through as single-char entries with nulls.
 */
export function matchTranslationsToText(
  text: string,
  tokens: WordTranslation[],
): AnnotatedWord[] {
  const queue = [...tokens]
  const result: AnnotatedWord[] = []

  for (let i = 0; i < text.length; ) {
    const firstWord = queue.at(0)?.word
    const firstLength = firstWord ? firstWord.length : 1
    const firstCandidate = text.substring(i, i + firstLength)

    const secondWord = queue.at(1)?.word
    const secondLength = secondWord ? secondWord.length : 1
    const secondCandidate = text.substring(i, i + secondLength)

    const currentChar = text[i]!

    if (isPunctuation(currentChar)) {
      if (firstWord === currentChar) {
        queue.shift()
      } else if (firstWord && firstWord.startsWith(currentChar)) {
        const head = queue[0]!
        queue[0] = { word: firstWord.replace(currentChar, ''), pinyin: head.pinyin, translation: head.translation }
      }
      result.push({ word: currentChar, pinyin: null, translation: null })
      i += 1
    } else if (firstCandidate === firstWord) {
      const token = queue.shift()!
      result.push({ word: token.word, pinyin: token.pinyin, translation: token.translation })
      i += firstCandidate.length
    } else if (secondCandidate === secondWord) {
      queue.shift()
      const token = queue.shift()!
      result.push({ word: token.word, pinyin: token.pinyin, translation: token.translation })
      i += secondCandidate.length
    } else {
      result.push({ word: text[i]!, pinyin: null, translation: null })
      i += 1
    }
  }

  return result
}
