import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { usePersonasStore } from '@/stores/personas'
import type { Persona } from '@/types'

const STORAGE_KEY = 'han-chat-personas'

/**
 * happy-dom >= 20 exposes a Proxy-based Storage whose methods are not
 * callable through vitest's global shim. We use a plain Map-backed
 * Storage and inject it via createPersistedState({ storage }).
 */
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

function createTestPinia(storage?: Storage) {
  const s = storage ?? testStorage
  const pinia = createPinia()
  // Pinia 3 defers plugins added via pinia.use() until pinia.install(app)
  // is called. In unit tests without a Vue app, we push directly into _p.
  pinia._p.push(createPersistedState({ storage: s }))
  return pinia
}

function validPersonaInput(): Omit<Persona, 'id' | 'createdAt'> {
  return {
    name: 'Li Wei',
    systemPrompt: 'You are a friendly Chinese tutor.',
    avatarDataUri: null,
  }
}

describe('personas store', () => {
  beforeEach(() => {
    testStorage = createMemoryStorage()
    setActivePinia(createTestPinia())
  })

  // 1. Initially empty
  it('starts with an empty personas array', () => {
    const store = usePersonasStore()
    expect(store.personas).toEqual([])
  })

  // 2. addPersona generates UUID and Date
  it('addPersona() creates a persona with a generated UUID and Date', () => {
    const fakeUuid = '00000000-1111-2222-3333-444444444444'
    const fakeNow = new Date('2026-03-29T10:00:00.000Z')

    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce(
      fakeUuid as `${string}-${string}-${string}-${string}-${string}`,
    )
    vi.useFakeTimers({ now: fakeNow })

    const store = usePersonasStore()
    store.addPersona(validPersonaInput())

    expect(store.personas).toHaveLength(1)
    expect(store.personas[0].id).toBe(fakeUuid)
    expect(store.personas[0].createdAt).toEqual(fakeNow)

    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // 3. addPersona sets correct fields from input
  it('addPersona() copies name, systemPrompt, and avatarDataUri from input', () => {
    const input: Omit<Persona, 'id' | 'createdAt'> = {
      name: 'Zhang Min',
      systemPrompt: 'Speak only in Mandarin.',
      avatarDataUri: 'data:image/png;base64,abc123',
    }

    const store = usePersonasStore()
    store.addPersona(input)

    const persona = store.personas[0]
    expect(persona.name).toBe(input.name)
    expect(persona.systemPrompt).toBe(input.systemPrompt)
    expect(persona.avatarDataUri).toBe(input.avatarDataUri)
  })

  // 4. getById returns the correct persona
  it('getById() returns the correct persona', () => {
    const store = usePersonasStore()
    store.addPersona(validPersonaInput())
    store.addPersona({ ...validPersonaInput(), name: 'Wang Fang' })

    const second = store.personas[1]
    expect(store.getById(second.id)).toBe(second)
  })

  // 5. getById returns undefined for unknown id
  it('getById() returns undefined for an unknown id', () => {
    const store = usePersonasStore()
    expect(store.getById('nonexistent-id')).toBeUndefined()
  })

  // 6. Persistence to localStorage
  it('persists data to localStorage after addPersona()', async () => {
    const store = usePersonasStore()
    store.addPersona(validPersonaInput())

    // $subscribe callback runs asynchronously via Vue's watch; flush it.
    await nextTick()

    const raw = testStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()

    const parsed: { personas: unknown[] } = JSON.parse(raw!)
    expect(parsed.personas).toHaveLength(1)
  })

  // 7. Date hydration after rehydration from localStorage
  it('hydrates createdAt as a Date instance from ISO string in localStorage', () => {
    const isoString = '2026-01-15T08:30:00.000Z'
    const storedData = {
      personas: [
        {
          id: 'hydration-test-id',
          name: 'Test Persona',
          systemPrompt: 'Test prompt',
          avatarDataUri: null,
          createdAt: isoString,
        },
      ],
    }
    testStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))

    // Create a fresh pinia so the store rehydrates from storage
    setActivePinia(createTestPinia())
    const store = usePersonasStore()

    expect(store.personas).toHaveLength(1)
    expect(store.personas[0].createdAt).toBeInstanceOf(Date)
    expect(store.personas[0].createdAt.toISOString()).toBe(isoString)
  })
})
