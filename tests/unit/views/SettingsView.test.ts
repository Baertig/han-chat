import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import SettingsView from '@/views/SettingsView.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
}))

vi.mock('@/services/credentials', () => ({
  saveApiKey: vi.fn().mockResolvedValue(undefined),
  isCredentialApiAvailable: vi.fn().mockReturnValue(true),
}))

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() { return data.size },
    clear() { data.clear() },
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => { data.delete(key) },
    setItem: (key: string, value: string) => { data.set(key, value) },
  }
}

function createTestPinia() {
  const pinia = createPinia()
  pinia.use(createPersistedState({ storage: createMemoryStorage() }))
  return pinia
}

describe('SettingsView', () => {
  let pinia: ReturnType<typeof createTestPinia>

  beforeEach(() => {
    pinia = createTestPinia()
    setActivePinia(pinia)
  })

  it('renders API key input', () => {
    render(SettingsView, { global: { plugins: [pinia] } })
    expect(screen.getByTestId('api-key-input')).toBeInTheDocument()
  })

  it('renders context window input', () => {
    render(SettingsView, { global: { plugins: [pinia] } })
    expect(screen.getByTestId('context-window-input')).toBeInTheDocument()
  })

  it('renders all four model inputs', () => {
    render(SettingsView, { global: { plugins: [pinia] } })
    expect(screen.getByTestId('chat-model-input')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-model-input')).toBeInTheDocument()
    expect(screen.getByTestId('translation-model-input')).toBeInTheDocument()
    expect(screen.getByTestId('phrase-model-input')).toBeInTheDocument()
  })

  it('renders save API key button', () => {
    render(SettingsView, { global: { plugins: [pinia] } })
    expect(screen.getByTestId('save-api-key-btn')).toBeInTheDocument()
  })
})
