# Tasks: UI Polish & Theming

**Input**: Design documents from `/specs/002-ui-polish-theming/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/css-api.md

**Tests**: Included per constitution mandate (TDD: Test-First Development is NON-NEGOTIABLE). E2E tests written before implementation for each user story. Unit tests for store changes.

**Organization**: Tasks grouped by user story. Each story is independently testable after its phase completes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependency, create the theme file (single source of truth), add Google Fonts, update global CSS

- [x] T001 Install lucide-vue-next dependency via `npm install lucide-vue-next`
- [x] T002 Add Google Fonts preconnect and stylesheet links for Noto Sans SC + Roboto to `index.html`
- [x] T003 Create `src/assets/theme.css` with all CSS custom properties: shared color tokens, light mode defaults, dark mode overrides via `@media (prefers-color-scheme: dark)`, typography tokens (`--font-chinese`, `--font-ui`), text size token (`--text-size-base`), and layout tokens (`--content-max-width`, `--content-padding`) per data-model.md and contracts/css-api.md
- [x] T004 Import theme.css in `src/App.vue` (before main.css) so tokens are available globally
- [x] T005 Update `src/assets/main.css` to reference theme tokens: set `body` background to `var(--color-bg-main)`, color to `var(--color-text-main)`, font-family to `var(--font-ui)`

**Checkpoint**: Theme tokens available globally. App renders with new color palette in light mode. Dark mode auto-switches via system preference.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks beyond Phase 1 setup. The theme.css file IS the foundation — once it's imported, all user stories can proceed.

**⚠️ CRITICAL**: Phase 1 must be complete before any user story work begins.

---

## Phase 3: User Story 1 — Dark & Light Mode with Cohesive Color Scheme (Priority: P1) 🎯 MVP

**Goal**: Replace all hardcoded colors across every component with CSS custom property references from theme.css. Light and dark mode work automatically via `prefers-color-scheme`.

**Independent Test**: Toggle system dark/light mode preference and verify every screen renders with the correct palette. No hardcoded color values remain in any component.

### E2E Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [US1] Write E2E test for light mode color scheme verification in `tests/e2e/theming.spec.ts` — verify `--color-bg-main` resolves to light mode value on page load, verify body background matches, verify text color matches `--color-text-main`
- [x] T007 [US1] Write E2E test for dark mode color scheme verification in `tests/e2e/theming.spec.ts` — emulate dark mode via `page.emulateMedia({ colorScheme: 'dark' })`, verify `--color-bg-main` resolves to dark mode value, verify body background and text colors update
- [x] T008 [US1] Write E2E test for consistent token usage across all screens in `tests/e2e/theming.spec.ts` — navigate to home, chat, settings, persona list; verify each screen's background and text use theme tokens in both light and dark mode
- [x] T009 [US1] Write E2E test for live mode switching in `tests/e2e/theming.spec.ts` — start in light mode, switch to dark mode via emulation, verify colors update without page reload

### Implementation for User Story 1

- [x] T010 [P] [US1] Replace all hardcoded colors in `src/views/HomeView.vue` with CSS custom property references — backgrounds use `var(--color-bg-main)` / `var(--color-bg-surface)`, text uses `var(--color-text-main)` / `var(--color-text-muted)`, borders use `var(--color-border)`, buttons/links use `var(--color-accent)`
- [x] T011 [P] [US1] Replace all hardcoded colors in `src/views/ChatView.vue` with CSS custom property references — header background, text colors, borders, button colors all reference theme tokens
- [x] T012 [P] [US1] Replace all hardcoded colors in `src/views/SettingsView.vue` with CSS custom property references
- [x] T013 [P] [US1] Replace all hardcoded colors in `src/views/PersonaListView.vue` with CSS custom property references
- [x] T014 [P] [US1] Replace all hardcoded colors in `src/components/chat/ChatMessage.vue` — user bubble: `var(--color-brand-primary)` bg with white text; assistant bubble: `var(--color-bg-surface)` bg with `var(--color-text-main)` text; timestamp uses `var(--color-text-muted)`
- [x] T015 [P] [US1] Replace all hardcoded colors in `src/components/chat/ChatInput.vue` — input border: `var(--color-border)`, focus border: `var(--color-accent)`, text: `var(--color-text-main)`, background: `var(--color-bg-surface)`, send button: `var(--color-accent)`
- [x] T016 [P] [US1] Replace all hardcoded colors in `src/components/chat/FeedbackIcon.vue` — success: `var(--color-status-success)`, error: `var(--color-status-error)`, pending spinner: `var(--color-text-muted)`
- [x] T017 [P] [US1] Replace all hardcoded colors in `src/components/chat/WordPopup.vue` — background: `var(--color-bg-surface)`, text: `var(--color-text-main)`, borders: `var(--color-border)`, pinyin/highlights: `var(--color-accent)`
- [x] T018 [P] [US1] Replace all hardcoded colors in `src/components/chat/CorrectionDialog.vue` — dialog background: `var(--color-bg-surface)`, overlay: `rgba(0, 0, 0, 0.4)`, text: `var(--color-text-main)`, borders: `var(--color-border)`
- [x] T019 [P] [US1] Replace all hardcoded colors in `src/components/persona/PersonaCard.vue` — background: `var(--color-bg-surface)`, text: `var(--color-text-main)`, border: `var(--color-border)`, hover: `var(--color-accent)`
- [x] T020 [P] [US1] Replace all hardcoded colors in `src/components/persona/PersonaPicker.vue` — background: `var(--color-bg-surface)`, overlay: `rgba(0, 0, 0, 0.4)`, text: `var(--color-text-main)`, border: `var(--color-border)`
- [x] T021 [P] [US1] Replace all hardcoded colors in `src/components/persona/PersonaForm.vue` — background: `var(--color-bg-main)`, inputs: `var(--color-bg-surface)`, labels: `var(--color-text-main)`, borders: `var(--color-border)`, buttons: `var(--color-accent)`
- [x] T022 [P] [US1] Replace all hardcoded colors in `src/components/common/AvatarPlaceholder.vue` — avatar background: `var(--color-brand-primary)`, text: white

**Checkpoint**: All screens render with the cohesive color palette. Dark mode works automatically. Zero hardcoded color values remain in components. E2E tests pass.

---

## Phase 4: User Story 2 — Typography with Chinese & English Font Pairing (Priority: P1)

**Goal**: Chinese text renders in Noto Sans SC, English/UI text renders in Roboto, with graceful fallbacks.

**Independent Test**: View chat messages containing both Chinese and English text; verify computed font-family for each.

### E2E Tests for User Story 2

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T023 [US2] Write E2E test for font application in `tests/e2e/typography.spec.ts` — verify that body computed font-family includes 'Roboto', verify Chinese message text computed font-family includes 'Noto Sans SC'
- [ ] T024 [US2] Write E2E test for font fallback in `tests/e2e/typography.spec.ts` — verify `--font-ui` and `--font-chinese` CSS custom properties are defined on `:root`

### Implementation for User Story 2

- [ ] T025 [US2] Apply `font-family: var(--font-chinese)` to Chinese text elements in `src/components/chat/ChatMessage.vue` — message content `.bubble-content` for assistant messages (which contain Chinese), pinyin text spans
- [ ] T026 [US2] Apply `font-family: var(--font-chinese)` to Chinese text elements in `src/components/chat/WordPopup.vue` — word display, example sentences
- [ ] T027 [US2] Apply `font-family: var(--font-chinese)` to Chinese text in `src/components/chat/CorrectionDialog.vue` — correction text content

**Checkpoint**: Chinese characters render in Noto Sans SC on all screens. English/UI text renders in Roboto (set globally in main.css from T005). E2E tests pass.

---

## Phase 5: User Story 3 — Mobile-First Responsive Layout with Max-Width (Priority: P1)

**Goal**: Content constrained to 720px max-width on wide screens, centered with empty space on sides. Full width on mobile.

**Independent Test**: Resize browser from mobile to desktop width; verify content is constrained and centered on wide viewports.

### E2E Tests for User Story 3

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T028 [US3] Write E2E test for responsive layout in `tests/e2e/layout.spec.ts` — at 1024px viewport width, verify main content area has max-width of 720px and is centered; at 375px viewport width, verify content uses full width with padding

### Implementation for User Story 3

- [ ] T029 [P] [US3] Add max-width container layout to `src/views/HomeView.vue` — wrap main content in container with `max-width: var(--content-max-width)`, `margin: 0 auto`, `padding: 0 var(--content-padding)`, full width on mobile
- [ ] T030 [P] [US3] Add max-width container layout to `src/views/ChatView.vue` — constrain chat area (header + messages + input) to max-width, centered on desktop
- [ ] T031 [P] [US3] Add max-width container layout to `src/views/SettingsView.vue` — constrain settings content to max-width, centered on desktop
- [ ] T032 [P] [US3] Add max-width container layout to `src/views/PersonaListView.vue` — constrain persona list content to max-width, centered on desktop

**Checkpoint**: All views constrained on desktop, full-width on mobile. E2E tests pass.

---

## Phase 6: User Story 4 — Auto-Growing Chat Input (Priority: P2)

**Goal**: Chat textarea grows vertically up to 3 lines, then becomes scrollable. Shrinks back when text is deleted.

**Independent Test**: Type text of varying lengths into chat input; verify growth/shrink/scroll behavior.

### E2E Tests for User Story 4

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T033 [US4] Write E2E test for auto-growing chat input in `tests/e2e/chat-input.spec.ts` — type single line: verify single-line height; type 3 lines: verify height increases; type 5+ lines: verify height stops growing and scrollbar appears; delete text back to 1 line: verify height shrinks back

### Implementation for User Story 4

- [ ] T034 [US4] Implement auto-grow textarea logic in `src/components/chat/ChatInput.vue` — add `@input` handler that resets `height` to `auto` then sets `height` to `scrollHeight + 'px'`; add CSS `max-height` for 3 lines based on line-height; add `overflow-y: auto` when at max-height; reset height on send (after clearing content)

**Checkpoint**: Chat input grows/shrinks dynamically. E2E tests pass.

---

## Phase 7: User Story 5 — Whitespace-Respecting Chat Messages (Priority: P2)

**Goal**: Messages preserve line breaks, paragraph spacing, and indentation from original content.

**Independent Test**: Send/receive messages with line breaks; verify whitespace is rendered.

### E2E Tests for User Story 5

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T035 [US5] Write E2E test for whitespace preservation in `tests/e2e/whitespace.spec.ts` — create a conversation with a message containing `\n` line breaks; verify rendered message displays visible line breaks (check element height is greater than single-line height, or check for presence of multiple text lines)

### Implementation for User Story 5

- [ ] T036 [US5] Add `white-space: pre-wrap` to message content elements in `src/components/chat/ChatMessage.vue` — apply to `.bubble-content` for both plain text messages and annotated word containers

**Checkpoint**: Messages with line breaks render those breaks visually. E2E tests pass.

---

## Phase 8: User Story 6 — Modern Icon Library (Priority: P2)

**Goal**: Replace all Unicode characters/HTML entities with Lucide Vue icons across the app.

**Independent Test**: Navigate all screens; verify SVG icons appear where Unicode characters were.

### E2E Tests for User Story 6

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T037 [US6] Write E2E test for vector icons in `tests/e2e/icons.spec.ts` — verify HomeView settings button renders an SVG element (not ⚙ text); verify ChatView back button renders an SVG element (not ← text); verify FeedbackIcon renders SVG elements for each state

### Implementation for User Story 6

- [ ] T038 [P] [US6] Replace `←` back button with `ArrowLeft` Lucide icon in `src/views/ChatView.vue`, `src/views/SettingsView.vue`, `src/views/PersonaListView.vue`, and `src/components/persona/PersonaForm.vue` — import `ArrowLeft` from `lucide-vue-next`, use `<ArrowLeft :size="20" />` with appropriate `color` via CSS
- [ ] T039 [P] [US6] Replace `⚙` settings button with `Settings` Lucide icon in `src/views/HomeView.vue` — import `Settings` from `lucide-vue-next`, use `<Settings :size="20" />`
- [ ] T040 [P] [US6] Replace `&#x27F3;` / `&#x26A0;` / `&#x2713;` / `&#x2717;` with Lucide icons in `src/components/chat/FeedbackIcon.vue` — `Loader2` (with spin animation), `AlertTriangle`, `Check`, `X` respectively; icons inherit color from parent via `currentColor`
- [ ] T041 [P] [US6] Replace `&times;` close buttons with `X` Lucide icon in `src/components/chat/CorrectionDialog.vue` and `src/components/chat/WordPopup.vue` — import `X` from `lucide-vue-next`, use `<X :size="18" />`

**Checkpoint**: All icons are crisp SVG vectors. Icons adapt color in dark mode via CSS token inheritance. E2E tests pass.

---

## Phase 9: User Story 7 — Configurable Text Size (Priority: P3)

**Goal**: User can choose from 4 text size presets in Settings. Choice persists and applies globally via `--text-size-base` CSS custom property.

**Independent Test**: Change text size in settings; verify all text across the app scales accordingly.

### Unit Tests for User Story 7

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T042 [US7] Write unit test for textSize in settings store in `tests/unit/settings.spec.ts` — verify `textSize` defaults to `'default'`, verify it can be set to each preset value (`'small'`, `'default'`, `'large'`, `'extra-large'`), verify it is included in persisted fields

### E2E Tests for User Story 7

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T043 [US7] Write E2E test for text size control in `tests/e2e/text-size.spec.ts` — navigate to Settings, verify text size control exists with preset options; select 'Large', verify `--text-size-base` on `:root` changes to `18px`; navigate to chat, verify message text font-size reflects the new base size; reload page, verify setting persists

### Implementation for User Story 7

- [ ] T044 [US7] Add `textSize` field to settings store in `src/stores/settings.ts` — add `textSize` ref with type `'small' | 'default' | 'large' | 'extra-large'`, default `'default'`, add to `persist.pick` array, export `TEXT_SIZE_MAP` constant mapping presets to px values
- [ ] T045 [US7] Add text size watcher and applier in `src/App.vue` — watch `settingsStore.textSize`, on change set `document.documentElement.style.setProperty('--text-size-base', TEXT_SIZE_MAP[textSize])`, also apply on `onMounted`
- [ ] T046 [US7] Add text size control UI to `src/views/SettingsView.vue` — add a "Text Size" section with 4 radio buttons or segmented control for Small/Default/Large/Extra Large, bind to `settingsStore.textSize`
- [ ] T047 [US7] Update font-size declarations across all components to use `var(--text-size-base)` and `calc()` relative sizes — headings: `calc(var(--text-size-base) + 4px)`, body text: `var(--text-size-base)`, small text: `calc(var(--text-size-base) - 2px)`, timestamp: `calc(var(--text-size-base) - 5px)` — update in all views and components

**Checkpoint**: Text size control works in settings. Change applies globally and persists. Layout remains intact at all sizes. E2E and unit tests pass.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all user stories

- [ ] T048 Verify no hardcoded hex color values remain in any `.vue` file (except allowed exceptions: `#FFFFFF` on brand-primary backgrounds, `rgba(0,0,0,0.4)` overlays) — run grep across all `.vue` files for `#[0-9a-fA-F]` patterns and fix any leaks
- [ ] T049 Run full E2E test suite against production build (`npm run build && npm run test:e2e`) — all tests must pass in both light and dark mode
- [ ] T050 Run quickstart.md validation — verify all development flow examples from quickstart.md work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Stories (Phase 3–9)**: All depend on Phase 1 completion
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1) — Color Scheme**: Can start after Phase 1. No dependencies on other stories. **All other stories benefit from US1 being done first** (colors already tokenized) but are not strictly blocked.
- **US2 (P1) — Typography**: Can start after Phase 1. Independent of US1.
- **US3 (P1) — Layout**: Can start after Phase 1. Independent of US1/US2.
- **US4 (P2) — Auto-Grow Input**: Can start after Phase 1. Independent.
- **US5 (P2) — Whitespace**: Can start after Phase 1. Independent.
- **US6 (P2) — Icons**: Can start after Phase 1 (T001 installs lucide-vue-next). Independent.
- **US7 (P3) — Text Size**: Can start after Phase 1. Depends on `--text-size-base` token existing in theme.css (created in T003). Independent of other stories.

### Within Each User Story

- E2E tests MUST be written and FAIL before implementation
- Unit tests (US7) MUST be written and FAIL before store changes
- Implementation tasks marked [P] within a story can run in parallel
- Story complete = all tests pass green

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 3 (US1)**: All component migration tasks (T010–T022) can run in parallel — each modifies a different file
- **Phase 4 (US2)**: T025–T027 can run in parallel
- **Phase 5 (US3)**: T029–T032 can run in parallel
- **Phase 8 (US6)**: T038–T041 can run in parallel
- **Cross-story**: US1, US2, US3 can run in parallel after Phase 1 (all P1, no inter-dependencies)
- **Cross-story**: US4, US5, US6 can run in parallel after Phase 1 (all P2, no inter-dependencies)

---

## Parallel Example: User Story 1

```bash
# Write all E2E tests first (sequential — same file):
T006: Light mode test in tests/e2e/theming.spec.ts
T007: Dark mode test in tests/e2e/theming.spec.ts
T008: Cross-screen test in tests/e2e/theming.spec.ts
T009: Live switching test in tests/e2e/theming.spec.ts

# Then launch ALL component migrations in parallel (different files):
T010: HomeView.vue
T011: ChatView.vue
T012: SettingsView.vue
T013: PersonaListView.vue
T014: ChatMessage.vue
T015: ChatInput.vue
T016: FeedbackIcon.vue
T017: WordPopup.vue
T018: CorrectionDialog.vue
T019: PersonaCard.vue
T020: PersonaPicker.vue
T021: PersonaForm.vue
T022: AvatarPlaceholder.vue
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 3: User Story 1 — Color Scheme (T006–T022)
3. **STOP and VALIDATE**: All screens render with cohesive palette in both light and dark mode
4. The app already looks dramatically better — this is the highest-impact change

### Incremental Delivery

1. Phase 1 → Foundation ready
2. US1 (Color Scheme) → Immediate visual transformation (MVP!)
3. US2 (Typography) → Chinese text is beautiful + readable
4. US3 (Layout) → Desktop users get centered, comfortable layout
5. US4 (Auto-Grow) → Chat input feels modern
6. US5 (Whitespace) → Messages are properly formatted
7. US6 (Icons) → Professional polish with vector icons
8. US7 (Text Size) → Accessibility enhancement
9. Phase 10 → Final polish and validation

Each increment is independently deployable and testable.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- The single theme.css file (T003) is the critical foundation — all stories reference it
- **Key constraint**: colors defined ONLY in theme.css — never in components
