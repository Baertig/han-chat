import type { Page } from '@playwright/test'

interface MockOverrides {
  chatReply?: string
  feedbackIsCorrect?: boolean
  feedbackTranslation?: string
  feedbackCorrected?: string
  translationWords?: Array<{ word: string; pinyin: string; translation: string }>
  phrasePhrase?: string
  phrasePinyin?: string
  phraseTranslation?: string
  error?: boolean
}

const defaults: Required<MockOverrides> = {
  chatReply: '你好！很高兴认识你。',
  feedbackIsCorrect: true,
  feedbackTranslation: 'Hello! Nice to meet you.',
  feedbackCorrected: '',
  translationWords: [
    { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
    { word: '很', pinyin: 'hěn', translation: 'very' },
    { word: '高兴', pinyin: 'gāo xìng', translation: 'happy' },
    { word: '认识', pinyin: 'rèn shi', translation: 'to know' },
    { word: '你', pinyin: 'nǐ', translation: 'you' },
  ],
  phrasePhrase: '你好世界',
  phrasePinyin: 'nǐ hǎo shì jiè',
  phraseTranslation: 'hello world',
  error: false,
}

export async function mockOpenRouter(page: Page, overrides: MockOverrides = {}) {
  const opts = { ...defaults, ...overrides }

  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    if (opts.error) {
      return route.abort('connectionrefused')
    }

    const body = JSON.parse(route.request().postData() ?? '{}')
    const hasJsonSchema = !!body.response_format?.json_schema
    const schemaName = body.response_format?.json_schema?.name ?? ''

    let content: string

    if (!hasJsonSchema) {
      // Chat reply — plain text
      content = opts.chatReply
    } else if (schemaName === 'grammar_feedback') {
      content = JSON.stringify({
        is_correct: opts.feedbackIsCorrect,
        translation: opts.feedbackTranslation,
        corrected: opts.feedbackCorrected,
      })
    } else if (schemaName === 'word_translations') {
      content = JSON.stringify({ words: opts.translationWords })
    } else if (schemaName === 'phrase_lookup') {
      content = JSON.stringify({
        phrase: opts.phrasePhrase,
        pinyin: opts.phrasePinyin,
        translation: opts.phraseTranslation,
      })
    } else {
      content = opts.chatReply
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { role: 'assistant', content } }],
      }),
    })
  })
}
