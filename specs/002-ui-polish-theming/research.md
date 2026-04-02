# Research: UI Polish & Theming

**Feature**: 002-ui-polish-theming | **Date**: 2026-04-02

## R1: Theming Approach — CSS Custom Properties in a Single File

**Decision**: Define all design tokens as CSS custom properties in one file: `src/assets/theme.css`. Light mode values on `:root`, dark mode overrides in `@media (prefers-color-scheme: dark)`. Components reference `var(--token-name)` exclusively — zero hardcoded colors in components.

**Rationale**:
- CSS custom properties are native, zero-JS-runtime, and supported by all target browsers
- A single file enforces the "defined once" constraint from the user and prevents token drift
- `prefers-color-scheme` media query provides automatic dark/light switching without JS logic
- No theme store needed — the browser handles mode detection and property switching
- Components use `var(--color-bg-main)` etc. — if a token changes, it changes everywhere at once

**Alternatives considered**:
- **Pinia theme store + JS class toggling**: Adds JS runtime overhead, requires store hydration, more complex than CSS-only. Rejected because there's no manual toggle — system preference drives the mode.
- **Tailwind CSS**: Would require adding a build dependency and learning a new class system. The project uses plain scoped CSS; Tailwind is overkill for ~14 components. Violates YAGNI.
- **CSS-in-JS (e.g., UnoCSS)**: Adds build complexity and a paradigm shift. No benefit over native CSS custom properties for this use case.

## R2: Icon Library — lucide-vue-next

**Decision**: Use `lucide-vue-next` for all vector icons.

**Rationale**:
- 2px uniform stroke design matches the "calm, clean, minimal" aesthetic
- Tree-shakeable named exports: each icon is ~500 bytes gzipped. Importing ~12 icons costs <6 KB total
- `stroke="currentColor"` by default — icons inherit color from CSS, works perfectly with the theme token system
- Zero runtime dependencies — pure Vue SFC render functions
- Full TypeScript definitions included
- 5,500+ icons — every icon needed is available: `ArrowLeft`, `Settings`, `X`, `Send`, `Loader2`, `Check`, `XCircle`, `AlertTriangle`, `Plus`, `Trash2`, `Pencil`, `User`

**Alternatives considered**:
- **Phosphor Vue** (`@phosphor-icons/vue`): 9,000+ icons across 6 weight variants. More expressive but the multiple weight variants add decision overhead and risk visual inconsistency. Larger package surface even with tree-shaking.
- **Heroicons** (`@heroicons/vue`): Only 316 icons — may hit gaps as the app grows. Bolder stroke weight doesn't match the calm aesthetic.
- **Inline SVG strings**: No dependency but no TypeScript props, no consistent sizing/color API, manual maintenance burden.

## R3: Font Loading — Google Fonts CDN

**Decision**: Load Noto Sans SC and Roboto via Google Fonts CDN `<link>` tags in `index.html` with `display=swap`.

**Rationale**:
- Google's CDN auto-subsets Noto Sans SC with `unicode-range` — critical for CJK fonts (full font is enormous, but browsers download only needed glyph ranges)
- Three `<link>` tags: two `preconnect` hints + one stylesheet link. Minimal code change
- `display=swap` query parameter injects `font-display: swap` into all `@font-face` rules — prevents FOIT (flash of invisible text)
- No build pipeline changes, no npm font packages to maintain
- Graceful fallback: system font stack (`-apple-system, ...`) renders immediately, web fonts swap in when ready

**Alternatives considered**:
- **Fontsource npm packages** (`@fontsource-variable/noto-sans-sc`, `@fontsource/roboto`): Self-hosted, no CDN dependency. But Noto Sans SC even with `chinese-simplified` subset is 300-600 KB added to dist/. Would need careful subsetting configuration. Better for offline-capable apps.
- **Self-hosted font files**: Maximum control but requires manual unicode-range splitting for CJK, which is complex and error-prone.

**Implementation detail**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Roboto:wght@400;500&display=swap">
```

**Font stacks** (in theme.css):
- `--font-chinese: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif`
- `--font-ui: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

## R4: Text Size System — CSS Custom Property + Pinia Persistence

**Decision**: Use a CSS custom property `--text-size-base` on `:root` with preset values. The settings store persists the user's choice. App.vue applies the value on mount and on change.

**Rationale**:
- A single CSS custom property on `:root` scales all `rem`-based and `em`-based sizes
- Preset levels (Small: 14px, Default: 16px, Large: 18px, Extra Large: 20px) keep it simple
- Pinia persistence ensures the setting survives sessions
- App.vue watches the store value and sets `document.documentElement.style.setProperty('--text-size-base', value)`
- All component font-sizes reference `var(--text-size-base)` or use `calc()` relative to it

**Alternatives considered**:
- **html font-size + rem units**: Would require converting all existing px values to rem. More intrusive refactor for the same result.
- **CSS zoom/scale**: Non-standard, affects layout dimensions unpredictably.
- **Browser zoom API**: Not programmatically controllable.

## R5: Auto-Growing Chat Input

**Decision**: Use a computed height approach: set textarea `height` to `scrollHeight` on input, capped at 3 lines via `max-height`.

**Rationale**:
- The textarea already exists with `rows="1"` and `resize: none`
- On `input` event: reset `height` to `auto`, then set `height` to `scrollHeight + 'px'`
- `max-height: calc(var(--text-size-base) * 1.4 * 3 + padding)` — 3 lines based on line-height
- When max-height is reached, native `overflow-y: auto` kicks in for scrolling
- When text is deleted, the same logic shrinks the textarea back

**Alternatives considered**:
- **contenteditable div**: More control but introduces HTML-in-input complexity, sanitization needs, and accessibility concerns. Overkill.
- **Third-party auto-resize library**: Unnecessary dependency for ~10 lines of logic.

## R6: Whitespace Preservation in Messages

**Decision**: Apply `white-space: pre-wrap` to chat message content elements.

**Rationale**:
- `pre-wrap` preserves line breaks and spaces from the original text while still wrapping at container boundaries
- Single CSS property change — zero JS logic needed
- Works for both user and assistant messages
- Does not affect annotated word spans (they are inline elements that flow normally within pre-wrap)

**Alternatives considered**:
- **Replacing \n with <br> in JS**: Requires HTML sanitization to prevent XSS. More complex than a CSS solution.
- **white-space: pre**: Doesn't wrap at container edge — would cause horizontal overflow.

## R7: Responsive Layout — Max-Width Container

**Decision**: Add a `max-width: 720px` and `margin: 0 auto` constraint to the main content area in each view, with full-width on mobile (<640px).

**Rationale**:
- 720px is within the 640-768px range suggested in the spec, providing comfortable reading width for chat
- Applied at the view level (not App.vue) so each view can control its own padding
- On mobile (< 640px viewport), content uses full width with `padding: 0 16px`
- Simple CSS — no container query library or resize observer needed

**Alternatives considered**:
- **CSS Container Queries**: Newer API with less browser support. Standard media queries are sufficient for this use case.
- **App-level max-width wrapper**: Would constrain all views identically, reducing flexibility. View-level is better.
