import { test, expect, type Page } from '@playwright/test'
import { mockOpenRouter } from './fixtures/openrouter'

/**
 * US-5: Message Feedback
 *
 * Tests that grammar feedback icons appear on user messages, that clicking
 * them opens the correction dialog, and that correct/incorrect states render
 * appropriately.
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

/** Send "你好" and wait for user message to appear. */
async function sendMessage(page: Page, text = '你好'): Promise<void> {
  const chatInput = page.getByTestId('chat-input')
  await chatInput.fill(text)
  await page.getByTestId('send-btn').click()

  await expect(page.getByTestId('message-user').first()).toBeVisible()
  await expect(page.getByTestId('message-user').first()).toContainText(text)
}

test.describe.serial('US-5 — Message Feedback', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.close()
  })

  test('AS1 — Green feedback icon: correct feedback shows a green icon on user message', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page, {
      feedbackIsCorrect: true,
      feedbackTranslation: 'Hello',
      feedbackCorrected: '',
    })
    await sendMessage(page)

    // Wait for the assistant reply to confirm both API calls completed
    await expect(page.getByTestId('message-assistant').first()).toBeVisible()

    // The green feedback icon should appear on the user message
    const feedbackCorrect = page.getByTestId('feedback-correct')
    await expect(feedbackCorrect.first()).toBeVisible()
  })

  test('AS2 — Correction dialog on correct: clicking the green icon opens the dialog with translation', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page, {
      feedbackIsCorrect: true,
      feedbackTranslation: 'Hello',
      feedbackCorrected: '',
    })
    await sendMessage(page)

    await expect(page.getByTestId('message-assistant').first()).toBeVisible()

    // Click the green feedback icon
    const feedbackCorrect = page.getByTestId('feedback-correct')
    await expect(feedbackCorrect.first()).toBeVisible()
    await feedbackCorrect.first().click()

    // The correction dialog should appear
    const dialog = page.getByTestId('correction-dialog')
    await expect(dialog).toBeVisible()

    // It should show the translation text
    await expect(dialog).toContainText('Hello')
  })

  test('AS3 — Red feedback icon: incorrect feedback shows red icon and diff content', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page, {
      feedbackIsCorrect: false,
      feedbackTranslation: 'How are you?',
      feedbackCorrected: '你好吗',
    })
    await sendMessage(page)

    await expect(page.getByTestId('message-assistant').first()).toBeVisible()

    // The red/incorrect feedback icon should appear
    const feedbackIncorrect = page.getByTestId('feedback-incorrect')
    await expect(feedbackIncorrect.first()).toBeVisible()

    // Click the red feedback icon
    await feedbackIncorrect.first().click()

    // The correction dialog should appear with diff content
    const dialog = page.getByTestId('correction-dialog')
    await expect(dialog).toBeVisible()

    // Should show the corrected text
    await expect(dialog).toContainText('你好吗')
  })

  test('AS4 — Dismiss correction dialog: clicking close hides the dialog', async ({ page }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page, {
      feedbackIsCorrect: true,
      feedbackTranslation: 'Hello',
      feedbackCorrected: '',
    })
    await sendMessage(page)

    await expect(page.getByTestId('message-assistant').first()).toBeVisible()

    // Open the dialog
    const feedbackCorrect = page.getByTestId('feedback-correct')
    await expect(feedbackCorrect.first()).toBeVisible()
    await feedbackCorrect.first().click()

    const dialog = page.getByTestId('correction-dialog')
    await expect(dialog).toBeVisible()

    // Close the dialog — try the close button first, fall back to clicking outside
    const closeBtn = page.getByTestId('correction-dialog-close')
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
    } else {
      // Click outside the dialog to dismiss it
      await page.getByTestId('chat-input').click()
    }

    // Dialog should disappear
    await expect(dialog).not.toBeVisible()
  })

  test('AS5 — Feedback eventually appears: feedback icon shows up after message is sent', async ({
    page,
  }) => {
    // This test verifies the feedback icon eventually resolves.
    // Since the mock responds instantly, this effectively just confirms
    // the feedback flow completes without timing issues.
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessage(page)

    await expect(page.getByTestId('message-assistant').first()).toBeVisible()

    // The feedback icon (either correct or incorrect) should eventually appear
    const feedbackIcon = page.getByTestId('feedback-correct').or(
      page.getByTestId('feedback-incorrect'),
    )
    await expect(feedbackIcon.first()).toBeVisible({ timeout: 10_000 })
  })
})
