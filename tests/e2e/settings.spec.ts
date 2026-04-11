import { test, expect } from '@playwright/test'

/**
 * Settings Screen
 *
 * Tests the settings view: API key input, context window persistence,
 * and model configuration inputs.
 */

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('All settings fields are visible', async ({ page }) => {
    await page.goto('/#/settings')

    // API key input
    await expect(page.getByTestId('api-key-input')).toBeVisible()

    // Context window input
    await expect(page.getByTestId('context-window-input')).toBeVisible()

    // Model inputs
    await expect(page.getByTestId('chat-model-input')).toBeVisible()
    await expect(page.getByTestId('feedback-model-input')).toBeVisible()
    await expect(page.getByTestId('translation-model-input')).toBeVisible()
    await expect(page.getByTestId('phrase-model-input')).toBeVisible()
  })

  test('Save API key without crashing', async ({ page }) => {
    await page.goto('/#/settings')

    const apiKeyInput = page.getByTestId('api-key-input')
    await apiKeyInput.fill('sk-test-key')

    const saveBtn = page.getByTestId('save-api-key-btn')
    await saveBtn.click()

    // The page should not crash — settings view should still be visible
    await expect(page.getByTestId('api-key-input')).toBeVisible()
  })

  test('Context window value persists across navigation', async ({ page }) => {
    await page.goto('/#/settings')

    const contextInput = page.getByTestId('context-window-input')
    await contextInput.clear()
    await contextInput.fill('15')

    // Navigate away to home
    await page.goto('/')

    // Navigate back to settings
    await page.goto('/#/settings')

    // The context window should still be 15
    await expect(page.getByTestId('context-window-input')).toHaveValue('15')
  })
})
