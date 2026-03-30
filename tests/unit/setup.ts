import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/vue'
import '@testing-library/jest-dom/vitest'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Provide a full localStorage implementation for tests
const store = new Map<string, string>()
const localStorageMock: Storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value) },
  removeItem: (key: string) => { store.delete(key) },
  clear: () => { store.clear() },
  get length() { return store.size },
  key: (index: number) => [...store.keys()][index] ?? null,
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

afterEach(() => {
  cleanup()
  store.clear()
})

/**
 * Helper to create a pinia instance with persistedstate plugin.
 * Import and call in tests: `setActivePinia(createTestPinia())`
 */
export function createTestPinia() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  return pinia
}
