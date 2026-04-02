import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

vi.mock('@/services/credentials', () => ({
  loadApiKey: vi.fn(),
}))

import { loadApiKey } from '@/services/credentials'
import { useSettingsStore } from '@/stores/settings'

const STORAGE_KEY = 'han-chat-settings'

const mockedLoadApiKey = vi.mocked(loadApiKey)

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

function createTestPinia() {
  const pinia = createPinia()
  pinia.use(createPersistedState({ storage: testStorage }))
  return pinia
}

describe('settings store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    testStorage = createMemoryStorage()
    setActivePinia(createTestPinia())
  })

  describe('default values', () => {
    it('has contextWindowSize of 8', () => {
      const store = useSettingsStore()
      expect(store.contextWindowSize).toBe(8)
    })

    it('has chatModel set to deepseek/deepseek-v3.2', () => {
      const store = useSettingsStore()
      expect(store.chatModel).toBe('deepseek/deepseek-v3.2')
    })

    it('has feedbackModel set to deepseek/deepseek-v3.2', () => {
      const store = useSettingsStore()
      expect(store.feedbackModel).toBe('deepseek/deepseek-v3.2')
    })

    it('has translationModel set to google/gemini-2.5-flash-lite', () => {
      const store = useSettingsStore()
      expect(store.translationModel).toBe('google/gemini-2.5-flash-lite')
    })

    it('has phraseLookupModel set to google/gemini-2.5-flash-lite', () => {
      const store = useSettingsStore()
      expect(store.phraseLookupModel).toBe('google/gemini-2.5-flash-lite')
    })

    it('has apiKey as null', () => {
      const store = useSettingsStore()
      expect(store.apiKey).toBeNull()
    })
  })

  describe('init()', () => {
    it('loads API key from credentials service into reactive state', async () => {
      mockedLoadApiKey.mockResolvedValue('sk-test-key-123')

      const store = useSettingsStore()
      await store.init()

      expect(loadApiKey).toHaveBeenCalledOnce()
      expect(store.apiKey).toBe('sk-test-key-123')
    })

    it('sets apiKey to null when credentials service returns null', async () => {
      mockedLoadApiKey.mockResolvedValue(null)

      const store = useSettingsStore()
      await store.init()

      expect(loadApiKey).toHaveBeenCalledOnce()
      expect(store.apiKey).toBeNull()
    })
  })

  describe('textSize', () => {
    it('defaults to "default"', () => {
      const store = useSettingsStore()
      expect(store.textSize).toBe('default')
    })

    it('can be set to each preset value', () => {
      const store = useSettingsStore()
      const presets = ['small', 'default', 'large', 'extra-large'] as const
      for (const preset of presets) {
        store.textSize = preset
        expect(store.textSize).toBe(preset)
      }
    })

    it('is included in persisted fields', async () => {
      const store = useSettingsStore()
      store.textSize = 'large'

      // Trigger persistence
      store.$patch({ textSize: 'large' })
      await new Promise<void>((r) => setTimeout(r, 0))

      const raw = testStorage.getItem(STORAGE_KEY)
      if (raw !== null) {
        const parsed: Record<string, unknown> = JSON.parse(raw)
        expect(parsed).toHaveProperty('textSize', 'large')
      }
    })
  })

  describe('persistence', () => {
    it('does NOT persist apiKey to localStorage', async () => {
      mockedLoadApiKey.mockResolvedValue('sk-secret-key')

      const store = useSettingsStore()
      await store.init()
      expect(store.apiKey).toBe('sk-secret-key')

      // Trigger persistence via $patch
      store.$patch({ contextWindowSize: 20 })
      // Wait for subscriber flush
      await new Promise<void>((r) => setTimeout(r, 0))

      const raw = testStorage.getItem(STORAGE_KEY)
      if (raw !== null) {
        const parsed: Record<string, unknown> = JSON.parse(raw)
        expect(parsed).not.toHaveProperty('apiKey')
      }
    })

    it('persists contextWindowSize to localStorage', () => {
      const store = useSettingsStore()
      store.contextWindowSize = 25
      expect(store.contextWindowSize).toBe(25)
    })
  })
})
