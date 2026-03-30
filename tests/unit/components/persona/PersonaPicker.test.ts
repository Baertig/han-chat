import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import PersonaPicker from '@/components/persona/PersonaPicker.vue'
import { usePersonasStore } from '@/stores/personas'
import type { Pinia } from 'pinia'

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

function createTestPinia(): Pinia {
  const pinia = createPinia()
  pinia._p.push(createPersistedState({ storage: createMemoryStorage() }))
  return pinia
}

describe('PersonaPicker', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createTestPinia()
    setActivePinia(pinia)
  })

  it('lists all personas from the store', () => {
    const store = usePersonasStore()
    store.addPersona({ name: 'Li Wei', systemPrompt: 'Tutor prompt', avatarDataUri: null })
    store.addPersona({ name: 'Zhang Min', systemPrompt: 'Another prompt', avatarDataUri: null })

    render(PersonaPicker, {
      global: { plugins: [pinia] },
    })

    const cards = screen.getAllByTestId('persona-card')
    expect(cards).toHaveLength(2)
  })

  it('emits picked with personaId when a persona is selected', async () => {
    const store = usePersonasStore()
    const persona = store.addPersona({ name: 'Li Wei', systemPrompt: 'Tutor prompt', avatarDataUri: null })

    const { emitted } = render(PersonaPicker, {
      global: { plugins: [pinia] },
    })

    const card = screen.getByTestId('persona-card')
    await fireEvent.click(card)

    expect(emitted()['picked']).toBeTruthy()
    expect(emitted()['picked']![0]).toEqual([persona.id])
  })

  it('emits cancel when cancel button is clicked', async () => {
    const store = usePersonasStore()
    store.addPersona({ name: 'Li Wei', systemPrompt: 'Tutor prompt', avatarDataUri: null })

    const { emitted } = render(PersonaPicker, {
      global: { plugins: [pinia] },
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await fireEvent.click(cancelButton)

    expect(emitted()['cancel']).toBeTruthy()
    expect(emitted()['cancel']).toHaveLength(1)
  })
})
