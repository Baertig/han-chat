import { test, expect } from '@playwright/test'

/**
 * Whitespace-Respecting Chat Messages (US5)
 */

test.describe('US5: Whitespace Preservation', () => {
  // T035: Line breaks are rendered
  test('Messages with line breaks display visible line breaks', async ({ page }) => {
    await page.goto('/')

    // Inject a conversation with a multi-line message into localStorage
    const conversationData = {
      conversations: [{
        id: 'test-ws',
        personaId: 'default',
        messages: [{
          id: 'msg-ws-1',
          conversationId: 'test-ws',
          role: 'assistant',
          content: 'Line one\nLine two\nLine three',
          timestamp: new Date().toISOString(),
          annotatedWords: null,
          wordTranslationStatus: null,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
    }

    await page.evaluate((data) => {
      localStorage.setItem('han-chat-conversations', JSON.stringify(data))
    }, conversationData)

    // Also need a persona
    const personaData = {
      personas: [{
        id: 'default',
        name: 'Tutor',
        systemPrompt: 'You are a tutor',
        avatarDataUri: null,
      }],
    }
    await page.evaluate((data) => {
      localStorage.setItem('han-chat-personas', JSON.stringify(data))
    }, personaData)

    await page.goto('/chat/test-ws')

    const msgEl = page.getByTestId('message-assistant').first()
    await expect(msgEl).toBeVisible()

    // Check that the content element has white-space: pre-wrap
    const whiteSpace = await msgEl.locator('.content').evaluate((el) =>
      getComputedStyle(el).whiteSpace,
    )
    expect(whiteSpace).toBe('pre-wrap')
  })
})
