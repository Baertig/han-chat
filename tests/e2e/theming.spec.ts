import { test, expect } from '@playwright/test'

/**
 * Theming — Dark & Light Mode with Cohesive Color Scheme (US1)
 *
 * Verifies CSS custom property tokens resolve correctly in both modes,
 * all screens use theme tokens consistently, and live switching works.
 */

// Light mode token values from theme.css
const LIGHT = {
  bgMain: 'rgb(248, 249, 250)', // #F8F9FA
  bgSurface: 'rgb(255, 255, 255)', // #FFFFFF
  textMain: 'rgb(45, 49, 66)', // #2D3142
  textMuted: 'rgb(79, 93, 117)', // #4F5D75
  border: 'rgb(226, 232, 240)', // #E2E8F0
}

// Dark mode token values from theme.css
const DARK = {
  bgMain: 'rgb(26, 29, 35)', // #1A1D23
  bgSurface: 'rgb(36, 41, 51)', // #242933
  textMain: 'rgb(224, 225, 221)', // #E0E1DD
  textMuted: 'rgb(154, 140, 152)', // #9A8C98
  border: 'rgb(51, 60, 77)', // #333C4D
}

async function getTokenValue(page: import('@playwright/test').Page, token: string): Promise<string> {
  return page.evaluate(
    (t) => getComputedStyle(document.documentElement).getPropertyValue(t).trim(),
    token,
  )
}

async function getBodyBg(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor)
}

async function getBodyColor(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).color)
}

test.describe('US1: Theming — Color Scheme', () => {
  // T006: Light mode verification
  test('Light mode: tokens resolve to light palette', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    const bgMain = await getTokenValue(page, '--color-bg-main')
    expect(bgMain).toBe('#F8F9FA')

    const bodyBg = await getBodyBg(page)
    expect(bodyBg).toBe(LIGHT.bgMain)

    const bodyColor = await getBodyColor(page)
    expect(bodyColor).toBe(LIGHT.textMain)
  })

  // T007: Dark mode verification
  test('Dark mode: tokens resolve to dark palette', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    const bgMain = await getTokenValue(page, '--color-bg-main')
    expect(bgMain).toBe('#1A1D23')

    const bodyBg = await getBodyBg(page)
    expect(bodyBg).toBe(DARK.bgMain)

    const bodyColor = await getBodyColor(page)
    expect(bodyColor).toBe(DARK.textMain)
  })

  // T008: All screens use theme tokens
  test('All screens use theme tokens in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })

    // Home screen
    await page.goto('/')
    expect(await getBodyBg(page)).toBe(LIGHT.bgMain)

    // Settings screen
    await page.goto('/settings')
    expect(await getBodyBg(page)).toBe(LIGHT.bgMain)
  })

  test('All screens use theme tokens in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })

    // Home screen
    await page.goto('/')
    expect(await getBodyBg(page)).toBe(DARK.bgMain)

    // Settings screen
    await page.goto('/settings')
    expect(await getBodyBg(page)).toBe(DARK.bgMain)
  })

  // T009: Live mode switching
  test('Live switching: colors update without reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    // Verify light mode
    expect(await getBodyBg(page)).toBe(LIGHT.bgMain)

    // Switch to dark mode without reloading
    await page.emulateMedia({ colorScheme: 'dark' })

    // Verify dark mode applied
    expect(await getBodyBg(page)).toBe(DARK.bgMain)
    expect(await getBodyColor(page)).toBe(DARK.textMain)
  })
})
