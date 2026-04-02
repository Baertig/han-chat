import { test, expect } from '@playwright/test'

/**
 * Configurable Text Size (US7)
 */

test.describe('US7: Text Size', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  // T043: Text size control and persistence
  test('Settings has text size control and changes apply globally', async ({ page }) => {
    await page.goto('/settings')

    // Text size control should exist
    const textSizeSection = page.getByTestId('text-size-control')
    await expect(textSizeSection).toBeVisible()

    // Select "Large"
    const largeOption = page.getByTestId('text-size-large')
    await largeOption.click()

    // Verify --text-size-base changed
    const baseSize = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--text-size-base').trim(),
    )
    expect(baseSize).toBe('18px')

    // Reload and verify persistence
    await page.reload()
    await page.goto('/settings')

    const persistedSize = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--text-size-base').trim(),
    )
    expect(persistedSize).toBe('18px')
  })
})
