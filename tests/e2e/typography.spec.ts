import { test, expect } from '@playwright/test'

/**
 * Typography — Chinese & English Font Pairing (US2)
 */

test.describe('US2: Typography', () => {
  // T023: Font application
  test('Body uses Roboto font family', async ({ page }) => {
    await page.goto('/')

    const fontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily,
    )
    expect(fontFamily.toLowerCase()).toContain('roboto')
  })

  // T024: Font CSS custom properties defined
  test('Font tokens are defined on :root', async ({ page }) => {
    await page.goto('/')

    const fontUi = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim(),
    )
    expect(fontUi).toContain('Roboto')

    const fontChinese = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-chinese').trim(),
    )
    expect(fontChinese).toContain('Noto Sans SC')
  })
})
