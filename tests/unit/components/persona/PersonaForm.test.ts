import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import PersonaForm from '@/components/persona/PersonaForm.vue'

// Mock the router
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useRoute: () => ({ params: {}, query: {} }),
}))

import { vi } from 'vitest'

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

describe('PersonaForm', () => {
  let pinia: ReturnType<typeof createTestPinia>

  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createTestPinia()
    setActivePinia(pinia)
  })

  it('renders name input, system prompt textarea, and save button', () => {
    render(PersonaForm, { global: { plugins: [pinia] } })
    expect(screen.getByTestId('persona-name-input')).toBeInTheDocument()
    expect(screen.getByTestId('persona-prompt-input')).toBeInTheDocument()
    expect(screen.getByTestId('persona-save-btn')).toBeInTheDocument()
  })

  it('save button is disabled when name is too short', async () => {
    render(PersonaForm, { global: { plugins: [pinia] } })
    await fireEvent.update(screen.getByTestId('persona-name-input'), 'A')
    await fireEvent.update(screen.getByTestId('persona-prompt-input'), 'Some prompt')
    expect(screen.getByTestId('persona-save-btn')).toBeDisabled()
  })

  it('save button is enabled when form is valid', async () => {
    render(PersonaForm, { global: { plugins: [pinia] } })
    await fireEvent.update(screen.getByTestId('persona-name-input'), 'Test Persona')
    await fireEvent.update(screen.getByTestId('persona-prompt-input'), 'A valid prompt')
    expect(screen.getByTestId('persona-save-btn')).not.toBeDisabled()
  })

  it('saves persona and navigates to persona list on submit', async () => {
    render(PersonaForm, { global: { plugins: [pinia] } })
    await fireEvent.update(screen.getByTestId('persona-name-input'), 'My Tutor')
    await fireEvent.update(screen.getByTestId('persona-prompt-input'), 'Be a friendly tutor.')
    await fireEvent.click(screen.getByTestId('persona-save-btn'))
    expect(mockPush).toHaveBeenCalledWith('/personas')
  })

  it('renders image file input', () => {
    render(PersonaForm, { global: { plugins: [pinia] } })
    expect(screen.getByTestId('persona-image-input')).toBeInTheDocument()
  })
})
