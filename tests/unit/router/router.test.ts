import { describe, it, expect } from 'vitest'
import router from '@/router'

describe('router', () => {
  it('has a route for / (HomeView)', () => {
    const resolved = router.resolve('/')
    expect(resolved.matched.length).toBeGreaterThan(0)
    expect(resolved.path).toBe('/')
    expect(resolved.name).toBe('home')
  })

  it('has a route for /chat/:id (ChatView)', () => {
    const resolved = router.resolve('/chat/abc-123')
    expect(resolved.matched.length).toBeGreaterThan(0)
    expect(resolved.path).toBe('/chat/abc-123')
    expect(resolved.name).toBe('chat')
    expect(resolved.params).toEqual({ id: 'abc-123' })
  })

  it('has a route for /personas (PersonaListView)', () => {
    const resolved = router.resolve('/personas')
    expect(resolved.matched.length).toBeGreaterThan(0)
    expect(resolved.path).toBe('/personas')
    expect(resolved.name).toBe('personas')
  })

  it('has a route for /personas/new (PersonaForm)', () => {
    const resolved = router.resolve('/personas/new')
    expect(resolved.matched.length).toBeGreaterThan(0)
    expect(resolved.path).toBe('/personas/new')
    expect(resolved.name).toBe('persona-new')
  })

  it('has a route for /settings (SettingsView)', () => {
    const resolved = router.resolve('/settings')
    expect(resolved.matched.length).toBeGreaterThan(0)
    expect(resolved.path).toBe('/settings')
    expect(resolved.name).toBe('settings')
  })
})
