import { test, expect, type Page } from '@playwright/test'
import { mockOpenRouter } from './fixtures/openrouter'

/**
 * US-2: Persona Management
 *
 * Tests creating custom personas, uploading images, verifying system prompts
 * are sent to OpenRouter, and placeholder avatars for image-less personas.
 *
 * These tests run serially because later tests depend on state created earlier.
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

test.describe.serial('US-2 — Persona Management', () => {
  test.beforeAll(async ({ browser }) => {
    // Clear localStorage to ensure a clean slate before the suite.
    const page = await browser.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.close()
  })

  test('AS1 — Form fields: persona creation form shows all required fields', async ({
    page,
  }) => {
    await page.goto('/personas/new')

    // Name input
    await expect(page.getByTestId('persona-name-input')).toBeVisible()

    // System prompt textarea
    await expect(page.getByTestId('persona-prompt-input')).toBeVisible()

    // Image file upload field
    await expect(page.getByTestId('persona-image-input')).toBeVisible()

    // Save button
    await expect(page.getByTestId('persona-save-btn')).toBeVisible()
  })

  test('AS2 — Save persona: creating a persona navigates to the list and shows the new entry', async ({
    page,
  }) => {
    await page.goto('/personas/new')

    // Fill in name and system prompt
    await page.getByTestId('persona-name-input').fill('Business Partner')
    await page
      .getByTestId('persona-prompt-input')
      .fill('You are a business Chinese speaker')

    // Save
    await page.getByTestId('persona-save-btn').click()

    // Should navigate to the persona list
    await expect(page).toHaveURL('/personas')

    // The new persona should appear in the list
    await expect(page.getByText('Business Partner')).toBeVisible()
  })

  test('AS3 — Image upload: file input exists for avatar image', async ({ page }) => {
    await page.goto('/personas/new')

    // Verify the file input is present in the DOM
    const fileInput = page.getByTestId('persona-image-input')
    await expect(fileInput).toBeAttached()
  })

  test('AS4 — System prompt used in conversation: persona system prompt is sent to OpenRouter', async ({
    page,
  }) => {
    // Create a persona with a distinctive system prompt
    await page.goto('/personas/new')
    await page.getByTestId('persona-name-input').fill('Test Persona')
    await page
      .getByTestId('persona-prompt-input')
      .fill('You are a test persona with unique instructions.')
    await page.getByTestId('persona-save-btn').click()
    await expect(page).toHaveURL('/personas')

    // Go home and start a new conversation
    await page.goto('/')
    await page.getByTestId('new-conversation-btn').click()

    const picker = page.getByTestId('persona-picker')
    await expect(picker).toBeVisible()
    await picker.getByText('Test Persona').click()
    await expect(page).toHaveURL(/\/chat\/[\w-]+/)

    // Inject API key
    await injectApiKey(page)

    // Set up OpenRouter mock and capture the request body
    let capturedSystemPrompt = ''
    await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}')
      const systemMessage = (body.messages as Array<{ role: string; content: string }>)?.find(
        (m) => m.role === 'system',
      )
      if (systemMessage) {
        capturedSystemPrompt = systemMessage.content
      }

      // Fulfill with a mock response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { role: 'assistant', content: '好的，我明白了。' } }],
        }),
      })
    })

    // Send a message
    const chatInput = page.getByTestId('chat-input')
    await chatInput.fill('你好')
    await page.getByTestId('send-btn').click()

    // Wait for the assistant reply to confirm the mock was called
    await expect(page.getByTestId('message-assistant').first()).toBeVisible()

    // Verify the system prompt was included in the request
    expect(capturedSystemPrompt).toContain('You are a test persona with unique instructions.')
  })

  test('AS5 — No-image persona shows placeholder: avatar placeholder visible for personas without images', async ({
    page,
  }) => {
    // Create a persona without uploading an image
    await page.goto('/personas/new')
    await page.getByTestId('persona-name-input').fill('No Image Persona')
    await page
      .getByTestId('persona-prompt-input')
      .fill('A persona without a custom avatar.')
    await page.getByTestId('persona-save-btn').click()
    await expect(page).toHaveURL('/personas')

    // The avatar placeholder should be visible for the image-less persona
    await expect(page.getByTestId('avatar-placeholder').first()).toBeVisible()
  })
})
