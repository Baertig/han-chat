# Quickstart: Chinese AI Tandem Chat

**Branch**: `001-chinese-tandem-chat` | **Date**: 2026-03-29

Use this guide to bootstrap the project, run tests, and validate the app end-to-end.

---

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm 10+ (or pnpm/bun equivalents)
- An [OpenRouter](https://openrouter.ai) account and API key
- A modern browser (Chrome 87+, Firefox 108+, Safari 15.4+)

---

## 1. Scaffold the Project

```bash
npm create vue@latest han-chat
# When prompted, select:
#   ✓ TypeScript
#   ✓ Vue Router
#   ✓ Pinia
#   ✓ Vitest
#   ✓ Playwright
#   ✓ ESLint + Prettier
```

```bash
cd han-chat
npm install

# Additional dependencies
npm install pinia-plugin-persistedstate diff
npm install -D @testing-library/vue @testing-library/jest-dom @testing-library/user-event happy-dom
```

---

## 2. Project Structure

After scaffolding, organise source per `plan.md`:

```
src/
  components/chat/      # ChatMessage, ChatInput, FeedbackIcon, CorrectionDialog, WordPopup
  components/persona/   # PersonaCard, PersonaForm, PersonaPicker
  components/common/    # AvatarPlaceholder
  views/                # HomeView, ChatView, PersonaListView, SettingsView
  stores/               # personas.ts, conversations.ts, settings.ts
  services/             # openrouter.ts, credentials.ts, segmenter.ts, diff.ts
  router/index.ts
  types/index.ts
tests/
  unit/
  e2e/
```

---

## 3. Configure Testing

**`vitest.config.ts`** (update the scaffolded file):
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.ts'],
  },
})
```

**`tests/unit/setup.ts`**:
```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/vue'
import matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)
afterEach(() => cleanup())
```

**`playwright.config.ts`** (update the scaffolded file):
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: process.env.CI
      ? 'npm run build && npm run preview'
      : 'npm run dev',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-iphone', use: { ...devices['iPhone 12'] } },
  ],
})
```

Add to **`package.json`** scripts:
```json
{
  "preview": "vite preview --port 4173",
  "test:unit": "vitest",
  "test:unit:run": "vitest run",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

## 4. TDD Workflow (per Constitution)

For every feature task:

```bash
# 1. Write failing test first
npm run test:unit:run   # → should FAIL (red)

# 2. Implement minimum code
npm run test:unit:run   # → should PASS (green)

# 3. Refactor, keep green
npm run test:unit:run   # → still green

# 4. Before marking story complete: run E2E against production build
npm run build && npm run test:e2e
```

**Gate**: Never commit implementation code without a prior failing test commit.

---

## 5. Development Server

```bash
npm run dev       # → http://localhost:5173
```

On first load, the app will prompt for an OpenRouter API key (if none stored).
Enter it in the Settings screen; it will be saved via the Credential Management API.

---

## 6. Production Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve dist/ locally at http://localhost:4173
```

The `dist/` directory contains static files that can be served from any static host
(GitHub Pages, Netlify, Cloudflare Pages) or opened via `file://`.

---

## 7. Validation Checklist

After completing all user story implementations, verify:

- [ ] `npm run test:unit:run` — all unit tests pass
- [ ] `npm run build && npm run test:e2e` — all Playwright E2E tests pass against production build
- [ ] Open `dist/index.html` directly from filesystem (`file://`) — app loads and is navigable
- [ ] Open DevTools → Application → Local Storage — no API key visible anywhere
- [ ] DevTools → Application → Passwords — OpenRouter key visible in credential store
- [ ] Disable network → app loads, existing conversations visible (SC-005)
- [ ] Mobile viewport (375px) — chat, persona list, settings all usable without horizontal scroll

---

## 8. OpenRouter API Key Setup

1. Create account at [openrouter.ai](https://openrouter.ai)
2. Generate an API key in the OpenRouter dashboard
3. Open the app → Settings → paste the key → Save
4. The browser will prompt to save the credential (accept it)
5. Test: send a message in a conversation — reply should arrive within ~5 seconds

**Supported models** (set per action in Settings):
- `deepseek/deepseek-v3.2` — default for chat reply and grammar feedback
- `google/gemini-2.5-flash-lite` — default for word translation and phrase lookup
- Any model string from [openrouter.ai/models](https://openrouter.ai/models)
