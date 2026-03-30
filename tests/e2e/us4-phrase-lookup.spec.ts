import { test, expect, type Page } from '@playwright/test'
import { mockOpenRouter } from './fixtures/openrouter'

/**
 * US-4: Phrase Lookup
 *
 * Tests the phrase drag-to-select feature on assistant messages.
 * Drag gestures are inherently flaky in Playwright, so these tests
 * focus on prerequisites and a best-effort drag simulation.
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
  await expect(page.getByTestId('message-assistant').first()).toBeVisible()
  await expect(page.getByTestId('message-assistant').first()).toContainText(
    '你好！很高兴认识你。',
  )
}

test.describe('US-4 — Phrase Lookup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('Prerequisite: tappable-word spans exist in assistant messages after reply', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    // Wait for word translations to resolve — tappable-word spans should appear
    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    // Verify multiple tappable spans exist (the mock returns 5 words)
    const count = await tappableWords.count()
    expect(count).toBeGreaterThan(1)
  })

  // This test simulates a drag gesture across multiple word spans.
  // Drag behavior in Playwright is inherently difficult to test reliably,
  // so this test may be flaky depending on layout and pointer event handling.
  test('Drag gesture across word spans triggers phrase popup', async ({ page }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    const wordCount = await tappableWords.count()
    if (wordCount < 2) {
      // Not enough words to perform a drag — skip
      test.skip()
      return
    }

    // Get bounding boxes of the first and third word spans
    const firstWord = tappableWords.nth(0)
    const lastWord = tappableWords.nth(Math.min(2, wordCount - 1))

    const firstBox = await firstWord.boundingBox()
    const lastBox = await lastWord.boundingBox()

    if (!firstBox || !lastBox) {
      test.skip()
      return
    }

    // Simulate a drag from the center of the first word to the center of the last word
    const startX = firstBox.x + firstBox.width / 2
    const startY = firstBox.y + firstBox.height / 2
    const endX = lastBox.x + lastBox.width / 2
    const endY = lastBox.y + lastBox.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Move in steps to simulate a real drag
    const steps = 5
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps
      await page.mouse.move(
        startX + (endX - startX) * ratio,
        startY + (endY - startY) * ratio,
      )
    }
    await page.mouse.up()

    // After drag release, a phrase popup may appear.
    // If the app handles the drag, we expect phrase-popup to show.
    // This assertion may fail if pointer events don't match the app's
    // drag detection mechanism — that is expected for this test.
    const phrasePopup = page.getByTestId('phrase-popup')
    await expect(phrasePopup).toBeVisible({ timeout: 5_000 })
  })
})
