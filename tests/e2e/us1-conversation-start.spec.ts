import { test, expect, type Page } from '@playwright/test'
import { mockOpenRouter } from './fixtures/openrouter'

/**
 * US-1: Conversation Start
 *
 * Tests the core flow of starting a new conversation with a persona,
 * sending/receiving messages, and resuming conversations from the home screen.
 *
 * These tests run serially because each builds on state from the previous one.
 */

/** Inject a test API key into the live Pinia settings store. */
async function injectApiKey(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Access the Vue app instance mounted on #app to reach the Pinia store.
    // The settings store does NOT persist apiKey (it uses the Credential
    // Management API), so we write directly to the reactive store.
    const el = document.getElementById('app') as HTMLElement | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = (el as any)?.__vue_app__
    if (app) {
      const pinia = app.config.globalProperties.$pinia
      if (pinia?.state?.value?.settings) {
        pinia.state.value.settings.apiKey = 'test-key-123'
      }
    }
  })
}

/** Navigate to home, create a new conversation, and land on the chat screen. */
async function createConversationViaPicker(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByTestId('new-conversation-btn').click()
  const picker = page.getByTestId('persona-picker')
  await expect(picker).toBeVisible()
  await picker.getByText('Chinese Tutor').click()
  await expect(page).toHaveURL(/\/chat\/[\w-]+/)
}

/** Send "你好" and wait for both user and assistant messages to appear. */
async function sendMessageAndAwaitReply(page: Page): Promise<void> {
  const chatInput = page.getByTestId('chat-input')
  await chatInput.fill('你好')
  await page.getByTestId('send-btn').click()

  await expect(page.getByTestId('message-user').first()).toBeVisible()
  await expect(page.getByTestId('message-user').first()).toContainText('你好')

  await expect(page.getByTestId('message-assistant').first()).toBeVisible()
  await expect(page.getByTestId('message-assistant').first()).toContainText(
    '你好！很高兴认识你。',
  )
}

test.describe.serial('US-1 — Conversation Start', () => {
  test.beforeAll(async ({ browser }) => {
    // Clear localStorage to ensure a clean slate before the suite.
    const page = await browser.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.close()
  })

  test('AS1 — Empty state: home screen shows empty list with action buttons', async ({
    page,
  }) => {
    await page.goto('/')

    // No conversation items should be present
    await expect(page.getByTestId('conversation-item')).toHaveCount(0)

    // Both action buttons should be visible
    await expect(page.getByTestId('new-conversation-btn')).toBeVisible()
    await expect(page.getByTestId('new-persona-btn')).toBeVisible()
  })

  test('AS2 — Persona picker: clicking "New conversation" opens picker with default persona', async ({
    page,
  }) => {
    await page.goto('/')

    await page.getByTestId('new-conversation-btn').click()

    // The persona picker modal/overlay should appear
    const picker = page.getByTestId('persona-picker')
    await expect(picker).toBeVisible()

    // The default "Chinese Tutor" persona should be listed
    await expect(picker.getByText('Chinese Tutor')).toBeVisible()
  })

  test('AS3 — Open chat: selecting a persona navigates to the chat screen', async ({
    page,
  }) => {
    await createConversationViaPicker(page)

    // The persona name should be visible on the chat screen
    await expect(page.getByText('Chinese Tutor')).toBeVisible()
  })

  test('AS4 — Send and receive: user sends a message and gets an assistant reply', async ({
    page,
  }) => {
    await createConversationViaPicker(page)

    // Inject API key and set up the mock before sending
    await injectApiKey(page)
    await mockOpenRouter(page)

    // Send message and verify round-trip
    await sendMessageAndAwaitReply(page)
  })

  test('AS5 — Home screen lists conversations with persona name and preview', async ({
    page,
  }) => {
    // Create a conversation and exchange a message
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    // Navigate back to home
    await page.goto('/')

    // The conversation should appear in the list
    const conversationItem = page.getByTestId('conversation-item')
    await expect(conversationItem.first()).toBeVisible()

    // Should show the persona name and a preview of the last message
    await expect(conversationItem.first()).toContainText('Chinese Tutor')
    await expect(conversationItem.first()).toContainText('你好！很高兴认识你。')
  })

  test('AS6 — Resume conversation: clicking a conversation shows full chat history', async ({
    page,
  }) => {
    // Create a conversation and exchange a message
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    // Go home
    await page.goto('/')

    // Click the conversation item to resume
    const conversationItem = page.getByTestId('conversation-item')
    await expect(conversationItem.first()).toBeVisible()
    await conversationItem.first().click()

    // Should navigate to the chat view
    await expect(page).toHaveURL(/\/chat\/[\w-]+/)

    // Both the user message and assistant reply should be visible
    await expect(page.getByTestId('message-user').first()).toContainText('你好')
    await expect(page.getByTestId('message-assistant').first()).toContainText(
      '你好！很高兴认识你。',
    )
  })
})
