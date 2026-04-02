# Data Model: UI Polish & Theming

**Feature**: 002-ui-polish-theming | **Date**: 2026-04-02

## Entity: Design Token System (theme.css)

The theme is defined **once** in `src/assets/theme.css` as CSS custom properties on `:root`. This is the single source of truth for all visual tokens in the application.

### Color Tokens — Shared (mode-independent)

| CSS Custom Property | Value | Usage |
|---|---|---|
| `--color-brand-primary` | `#4F6D7A` | User chat bubbles, avatars, structural elements |
| `--color-brand-secondary` | `#C0D6DF` | Secondary accents, decorative highlights |
| `--color-accent` | `#5B8A9A` | Interactive elements: buttons, links, active/hover states |
| `--color-status-success` | `#91A08D` | Success indicators (correct feedback) |
| `--color-status-error` | `#DBA8AC` | Error indicators (incorrect feedback) |

### Color Tokens — Light Mode (`:root` default)

| CSS Custom Property | Value | Usage |
|---|---|---|
| `--color-bg-main` | `#F8F9FA` | Page background |
| `--color-bg-surface` | `#FFFFFF` | Card/bubble/dialog backgrounds |
| `--color-text-main` | `#2D3142` | Primary text |
| `--color-text-muted` | `#4F5D75` | Secondary/helper text |
| `--color-border` | `#E2E8F0` | Borders, dividers |

### Color Tokens — Dark Mode (`@media (prefers-color-scheme: dark)`)

| CSS Custom Property | Value (override) |
|---|---|
| `--color-bg-main` | `#1A1D23` |
| `--color-bg-surface` | `#242933` |
| `--color-text-main` | `#E0E1DD` |
| `--color-text-muted` | `#9A8C98` |
| `--color-border` | `#333C4D` |

### Typography Tokens

| CSS Custom Property | Value | Usage |
|---|---|---|
| `--font-chinese` | `'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif` | Chinese text in messages |
| `--font-ui` | `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | English text, UI labels |

### Text Size Tokens

| CSS Custom Property | Default | Description |
|---|---|---|
| `--text-size-base` | `16px` | Base font size, overridden by user preference |

### Layout Tokens

| CSS Custom Property | Value | Description |
|---|---|---|
| `--content-max-width` | `720px` | Maximum content width on desktop viewports |
| `--content-padding` | `16px` | Horizontal padding for content areas |

### Derived/Computed Values (used in components, derived from tokens)

| Usage | CSS Expression |
|---|---|
| Chat bubble user bg | `var(--color-brand-primary)` |
| Chat bubble user text | `#FFFFFF` (constant white on brand-primary) |
| Chat bubble assistant bg | `var(--color-bg-surface)` |
| Chat bubble assistant text | `var(--color-text-main)` |
| Input border default | `var(--color-border)` |
| Input border focus | `var(--color-accent)` |
| Button primary bg | `var(--color-accent)` |
| Button primary text | `#FFFFFF` |
| Button hover | Lighten/darken via opacity overlay on accent |
| Overlay backdrop | `rgba(0, 0, 0, 0.4)` |

## Entity: TextSize Setting

**Location**: `src/stores/settings.ts`

| Field | Type | Default | Persisted | Description |
|---|---|---|---|---|
| `textSize` | `'small' \| 'default' \| 'large' \| 'extra-large'` | `'default'` | Yes (localStorage) | User-selected text size preset |

### Text Size Preset Mapping

| Preset | `--text-size-base` value |
|---|---|
| `small` | `14px` |
| `default` | `16px` |
| `large` | `18px` |
| `extra-large` | `20px` |

### State Transitions

```
User opens Settings → sees current textSize selection
User selects new size → textSize updates → Pinia persists to localStorage
                      → App.vue watcher sets --text-size-base on :root
User reopens app → Pinia hydrates textSize from localStorage
                 → App.vue onMounted sets --text-size-base
```

### Validation Rules

- `textSize` must be one of the four preset values
- Default value used if persisted value is invalid (migration safety)

## Relationship Map

```
theme.css (CSS custom properties)
  ├── :root (light mode defaults + shared tokens)
  │   ├── Color tokens → referenced by all components
  │   ├── Font tokens → referenced by body + message components
  │   ├── Layout tokens → referenced by view components
  │   └── --text-size-base → set dynamically by App.vue from settings store
  │
  └── @media (prefers-color-scheme: dark)
      └── Overrides --color-bg-*, --color-text-*, --color-border

settings.ts (Pinia store)
  └── textSize → persisted to localStorage
      └── watched by App.vue → sets --text-size-base on document.documentElement
```
