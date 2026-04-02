import { test, expect } from '@playwright/test'

/**
 * Modern Icon Library (US6)
 */

test.describe('US6: Vector Icons', () => {
  // T037: SVG icons replace Unicode characters
  test('Home settings button renders SVG icon', async ({ page }) => {
    await page.goto('/')

    const settingsBtn = page.getByTestId('settings-btn')
    await expect(settingsBtn).toBeVisible()

    // Should contain an SVG element, not Unicode text ⚙
    const svg = settingsBtn.locator('svg')
    await expect(svg).toBeVisible()
  })

  test('Chat back button renders SVG icon', async ({ page }) => {
    // Need to navigate to a chat view
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    // Create a conversation to get to chat view
    await page.getByTestId('new-conversation-btn').click()
    const picker = page.getByTestId('persona-picker')
    await expect(picker).toBeVisible()
    await page.getByTestId('persona-card').first().click()

    const backBtn = page.getByTestId('back-btn')
    await expect(backBtn).toBeVisible()

    const svg = backBtn.locator('svg')
    await expect(svg).toBeVisible()
  })
})
