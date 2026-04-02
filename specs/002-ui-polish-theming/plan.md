# Implementation Plan: UI Polish & Theming

**Branch**: `002-ui-polish-theming` | **Date**: 2026-04-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ui-polish-theming/spec.md`

## Summary

Polish the han-chat UI with a centralized theming system, dark/light mode, custom typography, responsive layout, auto-growing chat input, whitespace-preserving messages, vector icons, and configurable text size. The core approach is a **single CSS custom properties theme file** (`src/assets/theme.css`) that defines all color tokens, typography, and text sizing once — all components reference these variables instead of hardcoded values. Dark mode is handled via `prefers-color-scheme` media query toggling CSS custom property values.

**User input constraint**: The color theme MUST be defined only once in the application — in `src/assets/theme.css`. No component may define its own color values.

## Technical Context

**Language/Version**: TypeScript 6.x strict mode, Vue 3.5+ `<script setup>`
**Primary Dependencies**: Vue 3.5, Vite 8.x, Pinia 2, lucide-vue-next (new), Google Fonts CDN (Noto Sans SC + Roboto)
**Storage**: localStorage (Pinia persisted state for text size preference)
**Testing**: Vitest + @testing-library/vue + happy-dom (unit), Playwright + vite preview (E2E)
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge — current and one prior major)
**Project Type**: Client-only SPA (static build)
**Performance Goals**: No FOIT (font-display: swap), icons tree-shaken to <5 KB total
**Constraints**: Client-only (no server), static build output, Google Fonts CDN for font loading
**Scale/Scope**: 4 views, ~14 components, 1 CSS theme file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Client-Only Architecture — PASS

- All changes are CSS, Vue components, and client-side store updates
- Google Fonts CDN is a third-party external resource (permitted)
- lucide-vue-next is bundled at build time — no runtime server dependency
- No server-side rendering, no backend endpoints introduced

### II. Test-First Development — PASS (with plan)

- E2E tests will be written before implementation for each user story
- Unit tests for settings store text-size persistence written before store changes
- CSS theming is primarily visual; E2E visual assertions (element color checks) will verify token application
- TDD red-green-refactor cycle will be followed per constitution

### III. E2E Tests for User Interaction — PASS (with plan)

- User Story 1 (dark/light mode): E2E tests toggle prefers-color-scheme emulation, verify CSS custom property values
- User Story 2 (typography): E2E tests verify computed font-family on Chinese and English text
- User Story 3 (responsive layout): E2E tests resize viewport, verify max-width and centering
- User Story 4 (auto-growing input): E2E tests type multi-line text, verify textarea height changes
- User Story 5 (whitespace): E2E tests send messages with line breaks, verify rendered whitespace
- User Story 6 (icons): E2E tests verify SVG elements exist where Unicode characters were
- User Story 7 (text size): E2E tests change setting, verify computed font-size changes

### IV. Simplicity & YAGNI — PASS

- Single theme.css file with CSS custom properties — simplest theming approach, no JS runtime overhead
- prefers-color-scheme media query — no manual toggle, no theme store, no JS logic
- Google Fonts CDN — 3 link tags in index.html, no npm font packages
- lucide-vue-next — tree-shakeable named imports, zero runtime dependencies
- Text size via CSS custom property on :root — one variable, applied globally
- No CSS-in-JS, no Tailwind, no design system library — plain CSS custom properties

### Post-Phase 1 Re-check

- No violations introduced during design phase
- All decisions align with constitution principles
- New dependency (lucide-vue-next) justified: replaces Unicode symbols with professional vector icons; tree-shakeable, zero runtime deps

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-polish-theming/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── css-api.md       # CSS custom property contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── assets/
│   ├── main.css              # Global resets (existing, minor updates)
│   └── theme.css             # NEW — single source of truth for all design tokens
├── components/
│   ├── chat/
│   │   ├── ChatMessage.vue   # Updated: token refs, whitespace-pre-wrap, icon swap
│   │   ├── ChatInput.vue     # Updated: token refs, auto-grow textarea logic
│   │   ├── FeedbackIcon.vue  # Updated: token refs, lucide icons replace unicode
│   │   ├── WordPopup.vue     # Updated: token refs
│   │   └── CorrectionDialog.vue  # Updated: token refs
│   ├── persona/
│   │   ├── PersonaCard.vue   # Updated: token refs
│   │   ├── PersonaPicker.vue # Updated: token refs
│   │   └── PersonaForm.vue   # Updated: token refs
│   └── common/
│       └── AvatarPlaceholder.vue  # Updated: token refs
├── views/
│   ├── HomeView.vue          # Updated: token refs, layout max-width
│   ├── ChatView.vue          # Updated: token refs, layout max-width
│   ├── SettingsView.vue      # Updated: token refs, text size control added
│   └── PersonaListView.vue   # Updated: token refs, layout max-width
├── stores/
│   └── settings.ts           # Updated: add textSize ref, persist it
├── App.vue                   # Updated: import theme.css, apply text-size class
└── main.ts                   # Existing (no changes expected)

index.html                    # Updated: Google Fonts preconnect + stylesheet links

tests/
├── unit/
│   └── settings.spec.ts      # Updated: text size persistence tests
└── e2e/
    ├── theming.spec.ts       # NEW: dark/light mode E2E
    ├── typography.spec.ts    # NEW: font verification E2E
    ├── layout.spec.ts        # NEW: responsive layout E2E
    ├── chat-input.spec.ts    # Updated: auto-grow tests
    ├── whitespace.spec.ts    # NEW: whitespace preservation E2E
    ├── icons.spec.ts         # NEW: vector icon E2E
    └── text-size.spec.ts     # NEW: configurable text size E2E
```

**Structure Decision**: Follows the existing Vue SPA structure. The only new file is `src/assets/theme.css` — the single source of truth for all design tokens. All existing components are updated in-place to reference CSS custom properties from theme.css. No new directories are created.

## Complexity Tracking

> No violations. All decisions pass constitution check.

*Table intentionally empty — no complexity justifications needed.*
