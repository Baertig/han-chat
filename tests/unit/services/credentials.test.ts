import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadApiKey, saveApiKey, isCredentialApiAvailable } from '@/services/credentials'

/**
 * Helper: set up the global environment so `isCredentialApiAvailable()` returns
 * true and `navigator.credentials` methods are available.
 */
function stubCredentialApi(overrides: {
  get?: ReturnType<typeof vi.fn>
  store?: ReturnType<typeof vi.fn>
} = {}): void {
  class FakePasswordCredential {
    id: string
    password: string
    name: string | undefined
    type = 'password'
    constructor(data: { id: string; password: string; name?: string }) {
      this.id = data.id
      this.password = data.password
      this.name = data.name
    }
  }
  vi.stubGlobal('PasswordCredential', FakePasswordCredential)
  vi.stubGlobal('navigator', {
    credentials: {
      get: overrides.get ?? vi.fn().mockResolvedValue(null),
      store: overrides.store ?? vi.fn().mockResolvedValue(undefined),
    },
  })
}

describe('credentials service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('loadApiKey', () => {
    it('returns the key from a stored PasswordCredential', async () => {
      const fakeCredential = { password: 'test-key-123' }
      const getMock = vi.fn().mockResolvedValue(fakeCredential)
      stubCredentialApi({ get: getMock })

      const key = await loadApiKey()

      expect(getMock).toHaveBeenCalledOnce()
      expect(key).toBe('test-key-123')
    })

    it('returns null when no credential is stored', async () => {
      const getMock = vi.fn().mockResolvedValue(null)
      stubCredentialApi({ get: getMock })

      const key = await loadApiKey()

      expect(getMock).toHaveBeenCalledOnce()
      expect(key).toBeNull()
    })
  })

  describe('saveApiKey', () => {
    it('stores a PasswordCredential via navigator.credentials.store', async () => {
      const storeMock = vi.fn().mockResolvedValue(undefined)
      stubCredentialApi({ store: storeMock })

      await saveApiKey('my-secret-key')

      expect(storeMock).toHaveBeenCalledOnce()
      const storedCredential = storeMock.mock.calls[0]![0] as { id: string; password: string }
      expect(storedCredential.password).toBe('my-secret-key')
    })
  })

  describe('isCredentialApiAvailable', () => {
    it('returns true when window.PasswordCredential exists', () => {
      vi.stubGlobal('PasswordCredential', class FakePasswordCredential {})

      expect(isCredentialApiAvailable()).toBe(true)
    })

    it('returns false when window.PasswordCredential is undefined', () => {
      // Delete PasswordCredential so `'PasswordCredential' in window` is false
      if ('PasswordCredential' in window) {
        delete (window as Record<string, unknown>)['PasswordCredential']
      }

      expect(isCredentialApiAvailable()).toBe(false)
    })
  })
})
