# CSS Custom Property API Contract

**Feature**: 002-ui-polish-theming | **Date**: 2026-04-02

## Overview

The application exposes a set of CSS custom properties on `:root` that serve as the **sole interface** for all visual theming. Components MUST NOT define their own color values — they MUST reference these properties via `var()`.

## Contract: Color Tokens

### Invariant (available in both modes)

```css
:root {
  --color-brand-primary: #4F6D7A;
  --color-brand-secondary: #C0D6DF;
  --color-accent: #5B8A9A;
  --color-status-success: #91A08D;
  --color-status-error: #DBA8AC;
}
```

### Mode-dependent (values change based on `prefers-color-scheme`)

```css
/* Light mode (default) */
:root {
  --color-bg-main: #F8F9FA;
  --color-bg-surface: #FFFFFF;
  --color-text-main: #2D3142;
  --color-text-muted: #4F5D75;
  --color-border: #E2E8F0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-main: #1A1D23;
    --color-bg-surface: #242933;
    --color-text-main: #E0E1DD;
    --color-text-muted: #9A8C98;
    --color-border: #333C4D;
  }
}
```

## Contract: Typography Tokens

```css
:root {
  --font-chinese: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-ui: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

## Contract: Text Size Token

```css
:root {
  --text-size-base: 16px; /* default; overridden dynamically by App.vue */
}
```

**Dynamic behavior**: `App.vue` sets `--text-size-base` on `document.documentElement` based on the persisted `textSize` setting in the Pinia settings store. This property is the only one modified at runtime via JavaScript.

### Preset values

| Setting | Value |
|---|---|
| `small` | `14px` |
| `default` | `16px` |
| `large` | `18px` |
| `extra-large` | `20px` |

## Contract: Layout Tokens

```css
:root {
  --content-max-width: 720px;
  --content-padding: 16px;
}
```

## Usage Rules

1. **All components** MUST use `var(--color-*)` for colors — no hex literals, no `rgb()` literals
2. **Exception**: `#FFFFFF` for text on `brand-primary` backgrounds (constant white) and `rgba(0, 0, 0, 0.4)` for overlay backdrop (constant opacity)
3. **Font family** MUST reference `var(--font-chinese)` or `var(--font-ui)` — not direct font names
4. **Font size** in components SHOULD be relative to `var(--text-size-base)` using `calc()` where proportional scaling is needed
5. **Icon color** — lucide-vue-next icons inherit `currentColor`; set `color: var(--color-*)` on the parent element
6. **New components** MUST follow the same contract — no inline colors

## Verification

E2E tests will verify:
- `getComputedStyle(element).getPropertyValue('--color-bg-main')` returns correct value per mode
- No component renders a color not traceable to a `--color-*` token
- Text size changes propagate to all rendered text
