# Quickstart: UI Polish & Theming

**Feature**: 002-ui-polish-theming | **Date**: 2026-04-02

## Prerequisites

```bash
# Ensure you're on the feature branch
git checkout 002-ui-polish-theming

# Install the new icon library dependency
npm install lucide-vue-next
```

## Key Files to Know

| File | Role |
|---|---|
| `src/assets/theme.css` | **Single source of truth** for all design tokens (colors, fonts, sizing, layout) |
| `src/assets/main.css` | Global resets — updated to reference theme.css tokens |
| `src/stores/settings.ts` | Pinia store — adds `textSize` field |
| `src/App.vue` | Imports theme.css, watches textSize, sets `--text-size-base` on `:root` |
| `index.html` | Google Fonts CDN links added in `<head>` |

## Development Flow

### 1. Theme changes

Edit **only** `src/assets/theme.css`. Never add hex colors to component files.

```css
/* Example: changing the accent color */
:root {
  --color-accent: #5B8A9A; /* change this value here, applies everywhere */
}
```

### 2. Using colors in components

```vue
<style scoped>
.my-element {
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}
.my-button {
  background: var(--color-accent);
  color: white;
}
</style>
```

### 3. Using icons

```vue
<script setup lang="ts">
import { ArrowLeft, Settings } from 'lucide-vue-next'
</script>

<template>
  <ArrowLeft :size="20" />
  <Settings :size="20" />
</template>
```

Icons inherit `color` from their parent element via `currentColor`.

### 4. Using fonts

```css
.chinese-text {
  font-family: var(--font-chinese);
}
.ui-text {
  font-family: var(--font-ui);
}
```

### 5. Text sizing

All font sizes should reference `var(--text-size-base)` or use `calc()` for derived sizes:

```css
.message-text {
  font-size: var(--text-size-base);
}
.small-label {
  font-size: calc(var(--text-size-base) - 2px);
}
.heading {
  font-size: calc(var(--text-size-base) + 4px);
}
```

### 6. Responsive layout

```css
.view-container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--content-padding);
}
```

## Running Tests

```bash
# Unit tests (includes text size store tests)
npm run test:unit:run

# E2E tests (against production build)
npm run test:e2e
```

## Verifying Dark Mode

In Playwright E2E tests, dark mode is emulated via:
```ts
await page.emulateMedia({ colorScheme: 'dark' })
```

In the browser, toggle via DevTools: Elements → Rendering → Emulate CSS media feature prefers-color-scheme.
