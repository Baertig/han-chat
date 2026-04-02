import { test, expect } from '@playwright/test'

/**
 * Auto-Growing Chat Input (US4)
 */

test.describe('US4: Auto-Growing Chat Input', () => {
  // T033: Auto-grow behavior
  test('Textarea grows with multi-line content and shrinks back', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())

    // Navigate to a chat view — we need to create a conversation first
    // For this test we just need the chat input to be visible
    // Go to home and start a new conversation
    await page.goto('/')
    await page.getByTestId('new-conversation-btn').click()

    // Wait for persona picker and pick first persona
    const picker = page.getByTestId('persona-picker')
    await expect(picker).toBeVisible()
    const firstCard = page.getByTestId('persona-card').first()
    await firstCard.click()

    // Now we should be on the chat view
    const textarea = page.getByTestId('chat-input')
    await expect(textarea).toBeVisible()

    // Get initial height (single line)
    const initialHeight = await textarea.evaluate((el) => el.getBoundingClientRect().height)

    // Type multiple lines
    await textarea.fill('Line 1\nLine 2\nLine 3')
    const grownHeight = await textarea.evaluate((el) => el.getBoundingClientRect().height)

    // Height should have increased
    expect(grownHeight).toBeGreaterThan(initialHeight)

    // Clear text
    await textarea.fill('')
    await textarea.dispatchEvent('input')
    const shrunkHeight = await textarea.evaluate((el) => el.getBoundingClientRect().height)

    // Height should have shrunk back
    expect(shrunkHeight).toBeLessThanOrEqual(initialHeight + 2)
  })
})
