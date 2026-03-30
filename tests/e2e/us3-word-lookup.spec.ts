import { test, expect, type Page } from '@playwright/test'
import { mockOpenRouter } from './fixtures/openrouter'

/**
 * US-3: Word Lookup
 *
 * Tests tapping individual words in assistant messages to see pinyin and
 * translation in a popup, and verifying that user messages are not tappable.
 *
 * These tests run serially because each builds on state from the previous one.
 */

/** Inject a test API key into the live Pinia settings store. */
async function injectApiKey(page: Page): Promise<void> {
  await page.evaluate(() => {
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

test.describe.serial('US-3 — Word Lookup', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.close()
  })

  test('AS1 — Tappable words: clicking a word in an assistant message opens the word popup with pinyin', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    // Wait for word translations to resolve — tappable-word spans should appear
    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    // Click the first tappable word
    await tappableWords.first().click()

    // The word popup should appear and contain pinyin text
    const popup = page.getByTestId('word-popup')
    await expect(popup).toBeVisible()
    // The first word in the mock is 你好 with pinyin "nǐ hǎo"
    await expect(popup).toContainText('nǐ')
  })

  test('AS2 — Dismiss popup: clicking outside the popup closes it', async ({ page }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    // Open the popup first
    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()
    await tappableWords.first().click()
    await expect(page.getByTestId('word-popup')).toBeVisible()

    // Click outside the popup (e.g., the chat input area or the page body)
    await page.getByTestId('chat-input').click()

    // The popup should disappear
    await expect(page.getByTestId('word-popup')).not.toBeVisible()
  })

  test('AS3 — Popup data-testid: tapping a word shows a popup with data-testid="word-popup"', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()
    await tappableWords.first().click()

    // Verify the popup element exists with the correct data-testid
    const popup = page.getByTestId('word-popup')
    await expect(popup).toBeVisible()
    await expect(popup).toBeAttached()
  })

  test('AS4 — User messages are not tappable: user message bubbles should not contain tappable-word spans', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    // User messages should not have tappable-word spans
    const userMessage = page.getByTestId('message-user').first()
    await expect(userMessage).toBeVisible()

    const tappableInUser = userMessage.getByTestId('tappable-word')
    await expect(tappableInUser).toHaveCount(0)
  })
})
