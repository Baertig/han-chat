import { test, expect, type Page } from '@playwright/test'
import { mockOpenRouter } from './fixtures/openrouter'

/**
 * Error Paths
 *
 * Tests error handling: missing API key redirect, API failure resilience,
 * and partial failure (feedback fails but chat succeeds).
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

test.describe('Error Paths', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('No API key: sending a message redirects to /settings', async ({ page }) => {
    await createConversationViaPicker(page)

    // Do NOT inject an API key — it should be missing

    const chatInput = page.getByTestId('chat-input')
    await chatInput.fill('你好')
    await page.getByTestId('send-btn').click()

    // Should redirect to settings with a reason query param
    await expect(page).toHaveURL(/\/settings(\?|.*reason=)/)
  })

  test('API unreachable: app does not crash and user message is visible', async ({ page }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)

    // Mock OpenRouter to simulate a connection failure
    await mockOpenRouter(page, { error: true })

    const chatInput = page.getByTestId('chat-input')
    await chatInput.fill('你好')
    await page.getByTestId('send-btn').click()

    // The user message should still appear (optimistic update)
    await expect(page.getByTestId('message-user').first()).toBeVisible()
    await expect(page.getByTestId('message-user').first()).toContainText('你好')

    // The app should not crash — the chat input should remain usable
    await expect(page.getByTestId('chat-input')).toBeVisible()
  })

  test('Feedback fails but chat succeeds: assistant reply appears with feedback error icon', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)

    // Custom route handler: succeed for chat reply, fail for feedback
    await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}')
      const hasJsonSchema = !!body.response_format?.json_schema
      const schemaName = body.response_format?.json_schema?.name ?? ''

      if (!hasJsonSchema) {
        // Chat reply — succeed
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{ message: { role: 'assistant', content: '你好！很高兴认识你。' } }],
          }),
        })
      } else if (schemaName === 'grammar_feedback') {
        // Feedback — fail
        await route.abort('connectionrefused')
      } else {
        // Other structured calls (translations) — succeed with defaults
        let content: string
        if (schemaName === 'word_translations') {
          content = JSON.stringify({
            words: [
              { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
            ],
          })
        } else {
          content = JSON.stringify({})
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{ message: { role: 'assistant', content } }],
          }),
        })
      }
    })

    const chatInput = page.getByTestId('chat-input')
    await chatInput.fill('你好')
    await page.getByTestId('send-btn').click()

    // Assistant reply should still appear
    await expect(page.getByTestId('message-assistant').first()).toBeVisible()
    await expect(page.getByTestId('message-assistant').first()).toContainText(
      '你好！很高兴认识你。',
    )

    // Feedback should show an error state
    const feedbackError = page.getByTestId('feedback-error')
    await expect(feedbackError.first()).toBeVisible({ timeout: 10_000 })
  })
})
