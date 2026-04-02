import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatReply, grammarFeedback, translateMessage, translatePhrase } from '@/services/openrouter'
import { useSettingsStore } from '@/stores/settings'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(),
}))

vi.mock('@/services/translation-matcher', () => ({
  matchTranslationsToText: vi.fn((_text: string, tokens: Array<{ word: string; pinyin: string; translation: string }>) =>
    tokens.map((t) => ({ word: t.word, pinyin: t.pinyin, translation: t.translation })),
  ),
}))

const mockedUseSettingsStore = vi.mocked(useSettingsStore)

// ── Helpers ──────────────────────────────────────────────

interface ChatMessage {
  role: string
  content: string
}

function makeMessages(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `message-${i + 1}`,
  }))
}

function mockSettingsStore(overrides: {
  apiKey?: string | null
  chatModel?: string
  contextWindowSize?: number
  feedbackModel?: string
  translationModel?: string
  phraseLookupModel?: string
} = {}) {
  mockedUseSettingsStore.mockImplementation(() => ({
    apiKey: 'apiKey' in overrides ? overrides.apiKey : 'test-api-key',
    chatModel: overrides.chatModel ?? 'openai/gpt-4o',
    contextWindowSize: overrides.contextWindowSize ?? 10,
    feedbackModel: overrides.feedbackModel ?? 'deepseek/deepseek-v3.2',
    translationModel: overrides.translationModel ?? 'google/gemini-2.5-flash-lite',
    phraseLookupModel: overrides.phraseLookupModel ?? 'google/gemini-2.5-flash-lite',
  }) as ReturnType<typeof useSettingsStore>)
}

function mockFetchSuccess(content: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      choices: [{ message: { content } }],
    }),
  } as unknown as Response)
}

function mockFetchError(status: number, statusText: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ error: { message: statusText } }),
  } as unknown as Response)
}

// ── Tests ────────────────────────────────────────────────

describe('chatReply', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSettingsStore()
    globalThis.fetch = mockFetchSuccess('Hello from assistant')
  })

  // 1. Sends correct request body with system prompt + last N messages
  it('sends correct request body with system prompt and messages', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]
    const systemPrompt = 'You are a helpful assistant.'

    await chatReply(messages, systemPrompt)

    expect(globalThis.fetch).toHaveBeenCalledOnce()

    const [url, options] = vi.mocked(globalThis.fetch).mock.calls[0]!
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')

    const body = JSON.parse((options as RequestInit).body as string) as {
      model: string
      messages: ChatMessage[]
    }

    expect(body.model).toBe('openai/gpt-4o')
    expect(body.messages).toEqual([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ])

    expect((options as RequestInit).headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer test-api-key',
      }),
    )
  })

  // 2. Returns content from successful response
  it('returns content string from successful response', async () => {
    globalThis.fetch = mockFetchSuccess('Ni hao!')

    const result = await chatReply(
      [{ role: 'user', content: 'Hello' }],
      'System prompt',
    )

    expect(result).toBe('Ni hao!')
  })

  // 3. Respects contextWindowSize
  it('respects contextWindowSize — sends only last N messages', async () => {
    mockSettingsStore({ contextWindowSize: 3 })

    const messages = makeMessages(5)

    await chatReply(messages, 'System prompt')

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0]!
    const body = JSON.parse((options as RequestInit).body as string) as {
      messages: ChatMessage[]
    }

    // System message + last 3 of the 5 conversation messages
    expect(body.messages).toHaveLength(4)
    expect(body.messages[0]).toEqual({ role: 'system', content: 'System prompt' })
    expect(body.messages[1]).toEqual(messages[2])
    expect(body.messages[2]).toEqual(messages[3])
    expect(body.messages[3]).toEqual(messages[4])
  })

  // 4. System message always included and not counted toward N
  it('always includes system message without counting it toward N', async () => {
    mockSettingsStore({ contextWindowSize: 1 })

    const messages: ChatMessage[] = [
      { role: 'user', content: 'First' },
      { role: 'assistant', content: 'Second' },
      { role: 'user', content: 'Third' },
    ]

    await chatReply(messages, 'Be concise.')

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0]!
    const body = JSON.parse((options as RequestInit).body as string) as {
      messages: ChatMessage[]
    }

    // System + only the last 1 conversation message
    expect(body.messages).toHaveLength(2)
    expect(body.messages[0]).toEqual({ role: 'system', content: 'Be concise.' })
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Third' })
  })

  // 5. Throws on network error
  it('throws on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(
      chatReply([{ role: 'user', content: 'Hi' }], 'System'),
    ).rejects.toThrow()
  })

  // 6. Throws on 4xx response
  it('throws on 4xx response', async () => {
    globalThis.fetch = mockFetchError(401, 'Unauthorized')

    await expect(
      chatReply([{ role: 'user', content: 'Hi' }], 'System'),
    ).rejects.toThrow()
  })

  // 7. Throws on 5xx response
  it('throws on 5xx response', async () => {
    globalThis.fetch = mockFetchError(500, 'Internal Server Error')

    await expect(
      chatReply([{ role: 'user', content: 'Hi' }], 'System'),
    ).rejects.toThrow()
  })

  // 8. Throws on empty choices array
  it('throws on empty choices array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ choices: [] }),
    } as unknown as Response)

    await expect(
      chatReply([{ role: 'user', content: 'Hi' }], 'System'),
    ).rejects.toThrow()
  })

  // 9. Throws if apiKey is null
  it('throws if apiKey is null', async () => {
    mockSettingsStore({ apiKey: null })

    await expect(
      chatReply([{ role: 'user', content: 'Hi' }], 'System'),
    ).rejects.toThrow()
  })
})

describe('grammarFeedback', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSettingsStore()
  })

  it('sends correct payload with grammar teacher system prompt', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ is_correct: true, translation: 'Hello', corrected: '' }) } }],
      }),
    } as unknown as Response)

    await grammarFeedback('你好')

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0]!
    const body = JSON.parse((options as RequestInit).body as string) as {
      model: string
      messages: Array<{ role: string; content: string }>
      response_format: unknown
    }

    expect(body.model).toBe('deepseek/deepseek-v3.2')
    expect(body.messages[0]!.role).toBe('system')
    expect(body.messages[0]!.content).toContain('Chinese language teacher')
    expect(body.messages[1]!.content).toBe('你好')
    expect(body.response_format).toBeDefined()
  })

  it('parses FeedbackResult with camelCase normalisation', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ is_correct: false, translation: 'I am happy', corrected: '我很高兴' }) } }],
      }),
    } as unknown as Response)

    const result = await grammarFeedback('我很开兴')
    expect(result.isCorrect).toBe(false)
    expect(result.translation).toBe('I am happy')
    expect(result.corrected).toBe('我很高兴')
  })

  it('throws on error response', async () => {
    globalThis.fetch = mockFetchError(500, 'Server Error')
    await expect(grammarFeedback('test')).rejects.toThrow()
  })
})

describe('translateMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSettingsStore()
  })

  it('sends correct payload per translation contract', async () => {
    const translationResponse = { words: [{ word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' }] }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify(translationResponse) } }],
      }),
    } as unknown as Response)

    await translateMessage('你好')

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0]!
    const body = JSON.parse((options as RequestInit).body as string) as {
      model: string
      messages: Array<{ role: string; content: string }>
      response_format: { type: string; json_schema: { name: string } }
    }

    expect(body.model).toBe('google/gemini-2.5-flash-lite')
    expect(body.messages[0]!.content).toContain('Chinese language translation assistant')
    expect(body.messages[1]!.content).toContain('你好')
    expect(body.response_format.json_schema.name).toBe('word_translations')
  })

  it('returns AnnotatedWord[] from matchTranslationsToText', async () => {
    const words = [{ word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' }]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ words }) } }],
      }),
    } as unknown as Response)

    const result = await translateMessage('你好')
    expect(result).toHaveLength(1)
    expect(result[0]!.word).toBe('你好')
    expect(result[0]!.pinyin).toBe('nǐ hǎo')
  })
})

describe('translatePhrase', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSettingsStore()
  })

  it('sends correct payload per phrase lookup contract', async () => {
    const phraseResponse = { phrase: '学习汉语', pinyin: 'xuéxí hànyǔ', translation: 'to study Chinese' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify(phraseResponse) } }],
      }),
    } as unknown as Response)

    await translatePhrase('学习汉语')

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0]!
    const body = JSON.parse((options as RequestInit).body as string) as {
      model: string
      response_format: { type: string; json_schema: { name: string } }
    }

    expect(body.model).toBe('google/gemini-2.5-flash-lite')
    expect(body.response_format.json_schema.name).toBe('phrase_lookup')
  })

  it('strips punctuation from input', async () => {
    const phraseResponse = { phrase: '你好世界', pinyin: 'nǐ hǎo shì jiè', translation: 'hello world' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify(phraseResponse) } }],
      }),
    } as unknown as Response)

    await translatePhrase('你好，世界！')

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0]!
    const body = JSON.parse((options as RequestInit).body as string) as {
      messages: Array<{ content: string }>
    }
    // The user message should not contain punctuation
    expect(body.messages[1]!.content).not.toContain('，')
    expect(body.messages[1]!.content).not.toContain('！')
  })

  it('returns PhraseLookupResult', async () => {
    const phraseResponse = { phrase: '你好', pinyin: 'nǐ hǎo', translation: 'hello' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify(phraseResponse) } }],
      }),
    } as unknown as Response)

    const result = await translatePhrase('你好')
    expect(result.phrase).toBe('你好')
    expect(result.pinyin).toBe('nǐ hǎo')
    expect(result.translation).toBe('hello')
  })

  it('throws on error response', async () => {
    globalThis.fetch = mockFetchError(500, 'Server Error')
    await expect(translatePhrase('test')).rejects.toThrow()
  })
})
