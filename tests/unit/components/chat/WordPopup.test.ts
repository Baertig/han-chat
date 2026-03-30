import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import WordPopup from '@/components/chat/WordPopup.vue'

describe('WordPopup', () => {
  it('renders pinyin and translation when provided', () => {
    render(WordPopup, {
      props: { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
    })
    expect(screen.getByTestId('popup-pinyin')).toHaveTextContent('nǐ hǎo')
    expect(screen.getByTestId('popup-translation')).toHaveTextContent('hello')
  })

  it('shows "No translation found" when pinyin is null', () => {
    render(WordPopup, {
      props: { word: '。', pinyin: null, translation: null },
    })
    expect(screen.getByTestId('popup-no-translation')).toHaveTextContent('No translation found')
  })

  it('shows loading state when loading prop is true', () => {
    render(WordPopup, {
      props: { word: '你', pinyin: null, translation: null, loading: true },
    })
    expect(screen.getByTestId('popup-loading')).toHaveTextContent('Loading')
  })

  it('has data-testid="word-popup"', () => {
    render(WordPopup, {
      props: { word: '好', pinyin: 'hǎo', translation: 'good' },
    })
    expect(screen.getByTestId('word-popup')).toBeInTheDocument()
  })
})
