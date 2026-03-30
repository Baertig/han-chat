import { useSettingsStore } from '@/stores/settings'
import { matchTranslationsToText } from '@/services/translation-matcher'
import type { AnnotatedWord, WordTranslation, FeedbackResult, PhraseLookupResult } from '@/types'

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

interface ChatMessage {
  role: string
  content: string
}

async function callOpenRouter(
  model: string,
  messages: ChatMessage[],
  responseFormat?: Record<string, unknown>,
): Promise<string> {
  const settings = useSettingsStore()
  const apiKey = settings.apiKey

  if (!apiKey) {
    throw new OpenRouterError('No API key configured')
  }

  const body: Record<string, unknown> = { model, messages }
  if (responseFormat) {
    body.response_format = responseFormat
  }

  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new OpenRouterError('Network error')
  }

  if (!response.ok) {
    throw new OpenRouterError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content
  if (content === undefined || content === null) {
    throw new OpenRouterError('Empty response from API')
  }

  return content
}

export async function chatReply(
  conversationMessages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const settings = useSettingsStore()
  const windowSize = settings.contextWindowSize
  const model = settings.chatModel

  const recentMessages = conversationMessages.slice(-windowSize)
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...recentMessages,
  ]

  return callOpenRouter(model, messages)
}

const TRANSLATION_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'word_translations',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        words: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              pinyin: { type: 'string' },
              translation: { type: 'string' },
            },
            required: ['word', 'pinyin', 'translation'],
          },
        },
      },
      required: ['words'],
    },
  },
}

export async function translateMessage(text: string): Promise<AnnotatedWord[]> {
  const settings = useSettingsStore()
  const model = settings.translationModel

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a Chinese language translation assistant. Split the given Chinese text into individual words and provide pinyin and English translation for each word. Preserve the exact order',
    },
    {
      role: 'user',
      content: `Please translate this Chinese text and provide pinyin and translation for each word: "${text}"`,
    },
  ]

  const raw = await callOpenRouter(model, messages, TRANSLATION_SCHEMA)
  const parsed = JSON.parse(raw) as { words: WordTranslation[] }
  return matchTranslationsToText(text, parsed.words)
}

const FEEDBACK_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'grammar_feedback',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        is_correct: { type: 'boolean' },
        translation: { type: 'string' },
        corrected: { type: 'string' },
      },
      required: ['is_correct', 'translation', 'corrected'],
    },
  },
}

export async function grammarFeedback(userMessage: string): Promise<FeedbackResult> {
  const settings = useSettingsStore()
  const model = settings.feedbackModel

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a Chinese language teacher. Analyse the user\'s Chinese message for grammar and vocabulary errors. Return JSON only.',
    },
    {
      role: 'user',
      content: userMessage,
    },
  ]

  const raw = await callOpenRouter(model, messages, FEEDBACK_SCHEMA)
  const parsed = JSON.parse(raw) as {
    is_correct: boolean
    translation: string
    corrected: string
  }

  return {
    isCorrect: parsed.is_correct,
    translation: parsed.translation,
    corrected: parsed.corrected,
  }
}

const PHRASE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'phrase_lookup',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        phrase: { type: 'string' },
        pinyin: { type: 'string' },
        translation: { type: 'string' },
      },
      required: ['phrase', 'pinyin', 'translation'],
    },
  },
}

export async function translatePhrase(selectedText: string): Promise<PhraseLookupResult> {
  const settings = useSettingsStore()
  const model = settings.phraseLookupModel

  // Strip punctuation from input
  const cleaned = selectedText.replace(/[\s.,!?;:'"()\[\]{}。，！？、；：（）【】「」『」—…·\u3000-\u303F\uFF00-\uFFEF]/g, '')
  if (!cleaned) {
    throw new OpenRouterError('Empty selection after stripping punctuation')
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a Chinese language dictionary. Given a Chinese phrase or word, return its pinyin (with tone marks) and English translation. Ignore any punctuation in the input. Return JSON only.',
    },
    {
      role: 'user',
      content: cleaned,
    },
  ]

  const raw = await callOpenRouter(model, messages, PHRASE_SCHEMA)
  return JSON.parse(raw) as PhraseLookupResult
}
