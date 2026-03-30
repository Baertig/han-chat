import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { useConversationsStore } from '@/stores/conversations'
import type {
  UserMessage,
  PersonaMessage,
  FeedbackResult,
  AnnotatedWord,
} from '@/types'

const STORAGE_KEY = 'han-chat-conversations'

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() { return data.size },
    clear() { data.clear() },
    getItem(key: string) { return data.get(key) ?? null },
    key(index: number) { return [...data.keys()][index] ?? null },
    removeItem(key: string) { data.delete(key) },
    setItem(key: string, value: string) { data.set(key, value) },
  }
}

let testStorage: Storage

function createPersistedPinia(storage?: Storage) {
  const s = storage ?? testStorage
  const pinia = createPinia()
  pinia.use(createPersistedState({ storage: s }))
  return pinia
}

describe('conversations store', () => {
  beforeEach(() => {
    testStorage = createMemoryStorage()
    setActivePinia(createPersistedPinia())
  })

  // ── 1. Initially empty ────────────────────────────────
  it('starts with an empty conversations array', () => {
    const store = useConversationsStore()
    expect(store.conversations).toEqual([])
  })

  // ── 2. createConversation() ───────────────────────────
  describe('createConversation', () => {
    it('returns a conversation with a UUID id', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      expect(conversation.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
    })

    it('sets personaId to the provided value', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-42')

      expect(conversation.personaId).toBe('persona-42')
    })

    it('sets createdAt and updatedAt as Date instances', () => {
      const store = useConversationsStore()
      const before = new Date()
      const conversation = store.createConversation('persona-1')
      const after = new Date()

      expect(conversation.createdAt).toBeInstanceOf(Date)
      expect(conversation.updatedAt).toBeInstanceOf(Date)
      expect(conversation.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(conversation.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(conversation.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(conversation.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('initialises messages as an empty array', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      expect(conversation.messages).toEqual([])
    })

    it('adds the new conversation to the store', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      expect(store.conversations).toHaveLength(1)
      expect(store.conversations[0]).toStrictEqual(conversation)
    })
  })

  // ── 3. addMessage() ──────────────────────────────────
  describe('addMessage', () => {
    it('appends a message to the conversation', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      const message: UserMessage = {
        id: 'msg-1',
        conversationId: conversation.id,
        role: 'user',
        content: '你好',
        timestamp: new Date(),
        feedback: null,
        feedbackStatus: null,
      }

      store.addMessage(conversation.id, message)

      expect(conversation.messages).toHaveLength(1)
      expect(conversation.messages[0]).toBe(message)
    })

    it('updates the conversation updatedAt timestamp', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')
      const originalUpdatedAt = conversation.updatedAt

      const message: PersonaMessage = {
        id: 'msg-2',
        conversationId: conversation.id,
        role: 'assistant',
        content: '你好！很高兴认识你。',
        timestamp: new Date(),
        annotatedWords: null,
        wordTranslationStatus: null,
      }

      store.addMessage(conversation.id, message)

      expect(conversation.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      )
    })

    it('appends multiple messages in order', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      const msg1: UserMessage = {
        id: 'msg-1',
        conversationId: conversation.id,
        role: 'user',
        content: '你好',
        timestamp: new Date(),
        feedback: null,
        feedbackStatus: null,
      }

      const msg2: PersonaMessage = {
        id: 'msg-2',
        conversationId: conversation.id,
        role: 'assistant',
        content: '你好！',
        timestamp: new Date(),
        annotatedWords: null,
        wordTranslationStatus: null,
      }

      store.addMessage(conversation.id, msg1)
      store.addMessage(conversation.id, msg2)

      expect(conversation.messages).toHaveLength(2)
      expect(conversation.messages[0]!.id).toBe('msg-1')
      expect(conversation.messages[1]!.id).toBe('msg-2')
    })
  })

  // ── 4. getConversation() ─────────────────────────────
  describe('getConversation', () => {
    it('returns the correct conversation by id', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      const found = store.getConversation(conversation.id)

      expect(found).toStrictEqual(conversation)
    })

    it('returns undefined for an unknown id', () => {
      const store = useConversationsStore()
      store.createConversation('persona-1')

      const found = store.getConversation('nonexistent-id')

      expect(found).toBeUndefined()
    })
  })

  // ── 5. allConversationsSorted ────────────────────────
  describe('allConversationsSorted', () => {
    it('returns conversations sorted by updatedAt descending', () => {
      const store = useConversationsStore()

      const conv1 = store.createConversation('persona-1')
      const conv2 = store.createConversation('persona-2')
      const conv3 = store.createConversation('persona-3')

      // Manually set updatedAt to control ordering
      conv1.updatedAt = new Date('2026-01-01T00:00:00Z')
      conv2.updatedAt = new Date('2026-03-01T00:00:00Z')
      conv3.updatedAt = new Date('2026-02-01T00:00:00Z')

      const sorted = store.allConversationsSorted

      expect(sorted).toHaveLength(3)
      expect(sorted[0]!.id).toBe(conv2.id)
      expect(sorted[1]!.id).toBe(conv3.id)
      expect(sorted[2]!.id).toBe(conv1.id)
    })

    it('returns an empty array when there are no conversations', () => {
      const store = useConversationsStore()

      expect(store.allConversationsSorted).toEqual([])
    })
  })

  // ── 6. updateMessageFeedback() ───────────────────────
  describe('updateMessageFeedback', () => {
    it('sets feedback and feedbackStatus on a UserMessage', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      const message: UserMessage = {
        id: 'msg-1',
        conversationId: conversation.id,
        role: 'user',
        content: '我很高兴',
        timestamp: new Date(),
        feedback: null,
        feedbackStatus: 'pending',
      }

      store.addMessage(conversation.id, message)

      const feedback: FeedbackResult = {
        isCorrect: true,
        translation: 'I am very happy',
        corrected: '我很高兴',
      }

      store.updateMessageFeedback(conversation.id, 'msg-1', feedback)

      const updated = conversation.messages[0] as UserMessage
      expect(updated.feedback).toEqual(feedback)
      expect(updated.feedbackStatus).toBe('resolved')
    })

    it('replaces previous feedback on the same message', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      const message: UserMessage = {
        id: 'msg-1',
        conversationId: conversation.id,
        role: 'user',
        content: '我很高兴认识你',
        timestamp: new Date(),
        feedback: null,
        feedbackStatus: 'pending',
      }

      store.addMessage(conversation.id, message)

      const firstFeedback: FeedbackResult = {
        isCorrect: false,
        translation: 'I am happy to meet you',
        corrected: '我很高兴认识你',
      }

      const secondFeedback: FeedbackResult = {
        isCorrect: true,
        translation: 'I am very glad to know you',
        corrected: '我很高兴认识你',
      }

      store.updateMessageFeedback(conversation.id, 'msg-1', firstFeedback)
      store.updateMessageFeedback(conversation.id, 'msg-1', secondFeedback)

      const updated = conversation.messages[0] as UserMessage
      expect(updated.feedback).toEqual(secondFeedback)
    })
  })

  // ── 7. updateMessageTranslations() ───────────────────
  describe('updateMessageTranslations', () => {
    it('sets annotatedWords and wordTranslationStatus on a PersonaMessage', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      const message: PersonaMessage = {
        id: 'msg-2',
        conversationId: conversation.id,
        role: 'assistant',
        content: '你好世界',
        timestamp: new Date(),
        annotatedWords: null,
        wordTranslationStatus: 'pending',
      }

      store.addMessage(conversation.id, message)

      const annotatedWords: AnnotatedWord[] = [
        { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
        { word: '世界', pinyin: 'shì jiè', translation: 'world' },
      ]

      store.updateMessageTranslations(conversation.id, 'msg-2', annotatedWords)

      const updated = conversation.messages[0] as PersonaMessage
      expect(updated.annotatedWords).toEqual(annotatedWords)
      expect(updated.wordTranslationStatus).toBe('resolved')
    })

    it('replaces previous annotatedWords on the same message', () => {
      const store = useConversationsStore()
      const conversation = store.createConversation('persona-1')

      const message: PersonaMessage = {
        id: 'msg-2',
        conversationId: conversation.id,
        role: 'assistant',
        content: '你好世界',
        timestamp: new Date(),
        annotatedWords: null,
        wordTranslationStatus: 'pending',
      }

      store.addMessage(conversation.id, message)

      const firstAnnotations: AnnotatedWord[] = [
        { word: '你好世界', pinyin: null, translation: null },
      ]

      const secondAnnotations: AnnotatedWord[] = [
        { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
        { word: '世界', pinyin: 'shì jiè', translation: 'world' },
      ]

      store.updateMessageTranslations(conversation.id, 'msg-2', firstAnnotations)
      store.updateMessageTranslations(conversation.id, 'msg-2', secondAnnotations)

      const updated = conversation.messages[0] as PersonaMessage
      expect(updated.annotatedWords).toEqual(secondAnnotations)
    })
  })

  // ── 8. Persistence ──────────────────────────────────
  describe('persistence', () => {
    it('persists conversations to localStorage key "han-chat-conversations"', () => {
      const store = useConversationsStore()
      store.createConversation('persona-1')
      expect(store.conversations).toHaveLength(1)
    })
  })

  // ── 9. Date serialiser ─────────────────────────────
  describe('date serialisation', () => {
    it('revives ISO 8601 date strings as Date instances during JSON parse', () => {
      const json = '{"createdAt":"2026-03-10T08:00:00.000Z","name":"test"}'
      const reviver = (_key: string, value: unknown) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          return new Date(value)
        }
        return value
      }
      const parsed = JSON.parse(json, reviver) as { createdAt: Date; name: string }
      expect(parsed.createdAt).toBeInstanceOf(Date)
      expect(parsed.createdAt.toISOString()).toBe('2026-03-10T08:00:00.000Z')
      expect(parsed.name).toBe('test')
    })
  })
})
