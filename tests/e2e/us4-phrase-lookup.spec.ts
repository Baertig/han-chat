import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { mockOpenRouter } from './fixtures/openrouter'

/**
 * US-4: Phrase Lookup
 *
 * Tests the phrase drag-to-select feature on assistant messages.
 * Uses page.mouse for desktop (generates mouse pointer events) and
 * CDP Input.dispatchTouchEvent for mobile (generates real touch → pointer events).
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

/** Send "你好" and wait for both user and assistant messages to appear. */
async function sendMessageAndAwaitReply(page: Page): Promise<void> {
  const chatInput = page.getByTestId('chat-input')
  await chatInput.fill('你好')
  await page.getByTestId('send-btn').click()

  await expect(page.getByTestId('message-user').first()).toBeVisible()
  await expect(page.getByTestId('message-assistant').first()).toBeVisible()
  await expect(page.getByTestId('message-assistant').first()).toContainText(
    '你好！很高兴认识你。',
  )
}

/** Perform a drag gesture using page.mouse (works for desktop pointer events). */
async function dragAcrossWordsWithMouse(
  page: Page,
  firstWord: ReturnType<Page['locator']>,
  lastWord: ReturnType<Page['locator']>,
): Promise<void> {
  const firstBox = await firstWord.boundingBox()
  const lastBox = await lastWord.boundingBox()
  if (!firstBox || !lastBox) throw new Error('Could not get bounding boxes for drag')

  const startX = firstBox.x + firstBox.width / 2
  const startY = firstBox.y + firstBox.height / 2
  const endX = lastBox.x + lastBox.width / 2
  const endY = lastBox.y + lastBox.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  const steps = 10
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps
    await page.mouse.move(
      startX + (endX - startX) * ratio,
      startY + (endY - startY) * ratio,
    )
  }
  await page.mouse.up()
}

/**
 * Perform a drag gesture using CDP Input.dispatchTouchEvent.
 * This goes through the browser's native input pipeline and generates
 * real touch → pointer event sequences, matching actual mobile behavior.
 * Only works with Chromium-based browsers.
 */
async function dragAcrossWordsWithTouch(
  context: BrowserContext,
  page: Page,
  firstWord: ReturnType<Page['locator']>,
  lastWord: ReturnType<Page['locator']>,
): Promise<void> {
  const firstBox = await firstWord.boundingBox()
  const lastBox = await lastWord.boundingBox()
  if (!firstBox || !lastBox) throw new Error('Could not get bounding boxes for drag')

  const startX = firstBox.x + firstBox.width / 2
  const startY = firstBox.y + firstBox.height / 2
  const endX = lastBox.x + lastBox.width / 2
  const endY = lastBox.y + lastBox.height / 2

  const cdp = await context.newCDPSession(page)
  try {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY, id: 0 }],
      modifiers: 0,
    })

    const steps = 10
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{
          x: startX + (endX - startX) * ratio,
          y: startY + (endY - startY) * ratio,
          id: 0,
        }],
        modifiers: 0,
      })
    }

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: 0,
    })
  } finally {
    await cdp.detach()
  }
}

/** Check if the current browser supports CDP (Chromium only). */
function isCdpSupported(browserName: string): boolean {
  return browserName === 'chromium'
}

test.describe('US-4 — Phrase Lookup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('Prerequisite: tappable-word spans exist in assistant messages after reply', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    const count = await tappableWords.count()
    expect(count).toBeGreaterThan(1)
  })

  test('Drag gesture across word spans triggers phrase popup with translation', async ({
    page,
  }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    const wordCount = await tappableWords.count()
    if (wordCount < 2) {
      test.skip()
      return
    }

    const firstWord = tappableWords.nth(0)
    const lastWord = tappableWords.nth(Math.min(2, wordCount - 1))

    await dragAcrossWordsWithMouse(page, firstWord, lastWord)

    const popup = page.getByTestId('word-popup')
    await expect(popup).toBeVisible({ timeout: 5_000 })

    await expect(popup.getByTestId('popup-pinyin')).toContainText('nǐ hǎo shì jiè')
    await expect(popup.getByTestId('popup-translation')).toContainText('hello world')
  })

  test('Touch drag across word spans triggers phrase popup', async ({
    page, context, browserName,
  }) => {
    test.skip(!isCdpSupported(browserName), 'CDP touch events only supported in Chromium')

    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    const wordCount = await tappableWords.count()
    if (wordCount < 2) {
      test.skip()
      return
    }

    const firstWord = tappableWords.nth(0)
    const lastWord = tappableWords.nth(Math.min(2, wordCount - 1))

    await dragAcrossWordsWithTouch(context, page, firstWord, lastWord)

    const popup = page.getByTestId('word-popup')
    await expect(popup).toBeVisible({ timeout: 5_000 })

    await expect(popup.getByTestId('popup-pinyin')).toContainText('nǐ hǎo shì jiè')
    await expect(popup.getByTestId('popup-translation')).toContainText('hello world')
  })

  test('Drag highlight persists while popup is open', async ({ page }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    const wordCount = await tappableWords.count()
    if (wordCount < 2) {
      test.skip()
      return
    }

    await dragAcrossWordsWithMouse(page, tappableWords.nth(0), tappableWords.nth(1))

    const popup = page.getByTestId('word-popup')
    await expect(popup).toBeVisible({ timeout: 5_000 })

    const allWordSpans = page.locator('[data-word-idx]')
    const firstSpan = allWordSpans.nth(0)
    await expect(firstSpan).toHaveClass(/drag-selected/)
  })

  test('Close button dismisses popup and highlight', async ({ page }) => {
    await createConversationViaPicker(page)
    await injectApiKey(page)
    await mockOpenRouter(page)
    await sendMessageAndAwaitReply(page)

    const tappableWords = page.getByTestId('tappable-word')
    await expect(tappableWords.first()).toBeVisible()

    const wordCount = await tappableWords.count()
    if (wordCount < 2) {
      test.skip()
      return
    }

    await dragAcrossWordsWithMouse(page, tappableWords.nth(0), tappableWords.nth(1))

    const popup = page.getByTestId('word-popup')
    await expect(popup).toBeVisible({ timeout: 5_000 })

    await page.getByTestId('popup-close').click()

    await expect(popup).not.toBeVisible()

    const firstSpan = page.locator('[data-word-idx="0"]')
    await expect(firstSpan).not.toHaveClass(/drag-selected/)
  })
})
