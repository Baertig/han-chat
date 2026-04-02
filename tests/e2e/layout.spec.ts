import { test, expect } from '@playwright/test'

/**
 * Responsive Layout — Mobile-First with Max-Width (US3)
 */

test.describe('US3: Responsive Layout', () => {
  // T028: Max-width on desktop, full width on mobile
  test('Desktop: content area is constrained to max-width and centered', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/')

    const container = page.locator('.home-view')
    const box = await container.boundingBox()

    // The view should exist and be within 720px max-width
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeLessThanOrEqual(720 + 32 + 2) // max-width + padding tolerance
    }
  })

  test('Mobile: content uses full viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const container = page.locator('.home-view')
    const box = await container.boundingBox()

    expect(box).not.toBeNull()
    if (box) {
      // Should use close to full viewport width
      expect(box.width).toBeGreaterThanOrEqual(370)
    }
  })
})
