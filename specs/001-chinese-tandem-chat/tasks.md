# Tasks: Chinese AI Tandem Chat

**Input**: Design documents from `/specs/001-chinese-tandem-chat/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included — TDD is a constitution mandate for this project. Write failing tests before each implementation task.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and shared type definitions

- [X] T001 Scaffold Vue 3 + TypeScript project using `npm create vue@latest han-chat` (select TypeScript, Vue Router, Pinia, Vitest, Playwright, ESLint + Prettier)
- [X] T002 Install additional dependencies: `pinia-plugin-persistedstate diff` and dev deps `@testing-library/vue @testing-library/jest-dom @testing-library/user-event happy-dom`
- [X] T003 [P] Configure `vitest.config.ts` with happy-dom environment, globals, setupFiles pointing to `tests/unit/setup.ts`, include pattern `tests/unit/**/*.{test,spec}.ts`
- [X] T004 [P] Create `tests/unit/setup.ts` with `@testing-library/jest-dom` matchers and `cleanup()` afterEach
- [X] T005 [P] Configure `playwright.config.ts` with `testDir: ./tests/e2e`, `baseURL: http://localhost:4173`, webServer using `npm run build && npm run preview` in CI, chromium and mobile-iphone projects
- [X] T006 [P] Add `preview`, `test:unit`, `test:unit:run`, `test:e2e`, `test:e2e:ui` scripts to `package.json`
- [X] T007 Create directory structure: `src/components/chat/`, `src/components/persona/`, `src/components/common/`, `src/views/`, `src/stores/`, `src/services/`, `src/router/`, `src/types/`, `tests/unit/services/`, `tests/unit/stores/`, `tests/e2e/`
- [X] T008 [P] Define all shared TypeScript interfaces in `src/types/index.ts`: `Persona`, `Conversation`, `Message`, `FeedbackResult`, `WordTranslation`, `AppSettings` (including `chatModel`, `feedbackModel`, `translationModel`, `phraseLookupModel` strings)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services and stores that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Write failing unit tests for `credentials.ts` (store/retrieve API key, unavailable API fallback) in `tests/unit/services/credentials.test.ts`
- [X] T010 Implement `src/services/credentials.ts` with `saveApiKey(key: string)`, `getApiKey(): Promise<string | null>`, and `isCredentialApiAvailable(): boolean` using `navigator.credentials` PasswordCredential; throw if API unavailable
- [X] T011 Write failing unit tests for `openrouter.ts` (request shape, auth header, error paths for each of the 4 call types) in `tests/unit/services/openrouter.test.ts`
- [X] T012 Implement `src/services/openrouter.ts` with `chatReply()`, `grammarFeedback()`, `translateMessage()`, `translatePhrase()` — each accepts a `model: string` parameter (sourced from the corresponding `settings` store field); all call `POST https://openrouter.ai/api/v1/chat/completions`; structured JSON output for feedback/translation/phrase calls; throw typed errors on 4xx/5xx/network failure
- [X] T013 Write failing unit tests for `segmenter.ts` (tokenises Chinese text, skips punctuation) in `tests/unit/services/segmenter.test.ts`
- [X] T014 [P] Implement `src/services/segmenter.ts` using `Intl.Segmenter('zh', { granularity: 'word' })` to return array of `{ text, startIndex }` for Chinese-script segments only
- [X] T015 Write failing unit tests for `diff.ts` (char-level diff returns correct/incorrect/added segments) in `tests/unit/services/diff.test.ts`
- [X] T016 [P] Implement `src/services/diff.ts` wrapping `jsdiff diffChars()` to return `{ type: 'equal' | 'removed' | 'added', value: string }[]`
- [X] T017 Write failing unit tests for `personas` store (CRUD — `addPersona()`, `updatePersona()` — persistence key `han-chat-personas`, verify updated fields are persisted) in `tests/unit/stores/personas.test.ts`
- [X] T018 Implement `src/stores/personas.ts` as Pinia setup store with `personas: Persona[]`, `addPersona()`, `updatePersona()`, persisted to localStorage key `han-chat-personas` via pinia-plugin-persistedstate
- [X] T019 Write failing unit tests for `conversations` store (add conversation, add message, update message feedback/wordTranslations, orphaned-conversation lookup when `personaId` references a missing persona, persistence key `han-chat-conversations`) in `tests/unit/stores/conversations.test.ts`
- [X] T020 Implement `src/stores/conversations.ts` as Pinia setup store with `conversations: Conversation[]` (embedding messages), `addConversation()`, `addMessage()`, `updateMessageFeedback()`, `updateMessageWordTranslations()`, persisted to `han-chat-conversations`
- [X] T021 Write failing unit tests for `settings` store (contextWindowSize default 8 range 1–50, per-action model strings — `chatModel` and `feedbackModel` default `deepseek/deepseek-v3.2`, `translationModel` and `phraseLookupModel` default `openai/gpt-oss-120b` — persistence key `han-chat-settings`) in `tests/unit/stores/settings.test.ts`
- [X] T022 [P] Implement `src/stores/settings.ts` as Pinia setup store with `contextWindowSize: number` (default 8), `chatModel` and `feedbackModel` (default `'deepseek/deepseek-v3.2'`), `translationModel` and `phraseLookupModel` (default `'openai/gpt-oss-120b'`), persisted to `han-chat-settings`
- [X] T023 Configure `src/main.ts` to register Pinia with `pinia-plugin-persistedstate`, register Vue Router, and mount `App.vue`
- [X] T024 Create `src/router/index.ts` with routes: `/` → `HomeView`, `/chat/:id` → `ChatView`, `/personas` → `PersonaListView`, `/settings` → `SettingsView`
- [X] T024a [P] Create `tests/e2e/fixtures/openrouter.ts` — Playwright route fixture that intercepts `POST https://openrouter.ai/api/v1/chat/completions` and returns canned JSON responses per call type: chat reply (plain text assistant message), grammar feedback (structured JSON with `is_correct`, `translation`, `corrected`), word translation (structured JSON `words` array), phrase lookup (structured JSON `phrase`, `pinyin`, `translation`); export helper `mockOpenRouter(page, overrides?)` for use in all E2E spec files

**Checkpoint**: Foundation ready — all stores, services, and routing are in place; user story implementation can now begin

---

## Phase 3: User Story 1 — Persona Selection and Conversation Start (Priority: P1) 🎯 MVP

**Goal**: Home screen with conversation list, persona picker, chat screen with send/receive messages, conversation persistence

**Independent Test**: Open app with no data → create persona → start conversation → send one message → receive AI reply; verify full happy path works with no other features enabled

### E2E Tests for User Story 1 ⚠️ Write FIRST — must FAIL before implementation

- [X] T025 [US1] Write E2E test: first-open shows empty conversations list with "New conversation" and "New persona" buttons in `tests/e2e/us1-conversation-start.spec.ts`
- [X] T026 [US1] Write E2E test: tapping "New conversation" with no personas shows persona picker; creating first persona and confirming opens chat screen in `tests/e2e/us1-conversation-start.spec.ts`
- [X] T027 [US1] Write E2E test: sending a message in chat displays it and returns AI reply; use `mockOpenRouter(page)` from `tests/e2e/fixtures/openrouter.ts` to intercept the OpenRouter API call — no real network call is made in `tests/e2e/us1-conversation-start.spec.ts`
- [X] T028 [US1] Write E2E test: past conversations appear on home screen with persona name, last message preview, timestamp; tapping resumes full chat history in `tests/e2e/us1-conversation-start.spec.ts`

### Implementation for User Story 1

- [X] T029 [P] [US1] Implement `src/components/common/AvatarPlaceholder.vue` — shows generated initials-based avatar when no `avatarDataUri` is set; accepts `name: string` prop
- [X] T030 [P] [US1] Implement `src/components/persona/PersonaCard.vue` — displays persona avatar (or AvatarPlaceholder), name; emits `select` event; used in picker and list
- [X] T031 [US1] Implement `src/components/persona/PersonaPicker.vue` — modal overlay listing all personas via `PersonaCard`; emits `picked(personaId)` and `cancel`; used by HomeView to start a new conversation
- [X] T032 [US1] Implement `src/views/HomeView.vue` — fetches conversations from store ordered by `updatedAt` desc; shows empty state with "New conversation" and "New persona" buttons; shows conversation list (persona name, last message preview, timestamp); tapping a conversation navigates to `/chat/:id`; "New conversation" opens `PersonaPicker`; "New persona" navigates to `/personas`
- [X] T033 [US1] Implement `src/components/chat/ChatInput.vue` — textarea + send button; emits `send(text: string)`; disables send when input is empty or when `disabled` prop is true; clears after send
- [X] T034 [US1] Implement `src/components/chat/ChatMessage.vue` (US1 subset) — renders message bubble with role-based alignment and text content; no word segmentation or feedback icon yet (added in US3/US5)
- [X] T035 [US1] Implement `src/views/ChatView.vue` — loads conversation + persona from stores; renders `ChatMessage` list; renders `ChatInput`; on send: adds user message to store, calls `openrouter.chatReply()` in parallel with `openrouter.grammarFeedback()`, adds assistant message when reply resolves; handles API key missing → redirect to `/settings` with explanatory message; handles network errors → inline retry error on message bubble
- [X] T036 [US1] Create `src/App.vue` with `<RouterView>` and minimal navigation shell (back button, settings icon)

**Checkpoint**: US1 complete — app is a functional chat with persona selection and conversation persistence

---

## Phase 4: User Story 2 — Persona Creation and Management (Priority: P2)

**Goal**: Full persona creation form with name, system prompt, profile image upload and client-side resize; persona list management

**Independent Test**: From empty state — create persona with name, profile image, system prompt → verify in persona list → start conversation → confirm AI uses system prompt

### E2E Tests for User Story 2 ⚠️ Write FIRST — must FAIL before implementation

- [X] T037 [US2] Write E2E test: "New persona" form shows name, profile image, and system prompt fields; saving persists persona in list in `tests/e2e/us2-persona-creation.spec.ts`
- [X] T038 [US2] Write E2E test: selecting a profile image shows cropped preview and persona is saved with avatar; persona without image shows AvatarPlaceholder in `tests/e2e/us2-persona-creation.spec.ts`
- [X] T039 [US2] Write E2E test: starting conversation with saved persona uses that persona's system prompt in the LLM call in `tests/e2e/us2-persona-creation.spec.ts`

### Implementation for User Story 2

- [X] T040 [P] [US2] Implement client-side image resize utility in `src/services/imageResize.ts` — accepts File, returns `data:image/...;base64,...` string ≤200 KB; uses Canvas API to resize proportionally
- [X] T041 [US2] Implement `src/components/persona/PersonaForm.vue` — fields: name (required, >1 char), system prompt (required, 1–2000 chars), profile image (optional file input with preview); on save emits `saved(persona: Omit<Persona, 'id' | 'createdAt'>)`; shows validation errors inline; calls `imageResize.ts` before storing avatar
- [X] T042 [US2] Implement `src/views/PersonaListView.vue` — lists all personas via `PersonaCard`; "New persona" button opens `PersonaForm` inline or navigates to creation route; no delete in v1; tapping a persona allows starting a new conversation
- [X] T043 [US2] Wire `PersonaForm` save to `personas` store `addPersona()` with UUID and `createdAt` generated via `crypto.randomUUID()` and `new Date().toISOString()`

**Checkpoint**: US2 complete — full persona lifecycle; US1 + US2 work together

---

## Phase 5: User Story 3 — Single-Word Lookup (Priority: P3)

**Goal**: Every Chinese word in any message is tappable; popup shows pinyin + English translation from pre-fetched `wordTranslations`

**Independent Test**: Open any conversation with Chinese text → tap a word → verify pinyin and translation popup appears within 2 s; tap outside to dismiss

### E2E Tests for User Story 3 ⚠️ Write FIRST — must FAIL before implementation

- [X] T044 [US3] Write E2E test: tapping a Chinese word in an assistant message shows popup with pinyin and translation in `tests/e2e/us3-word-lookup.spec.ts`
- [X] T045 [US3] Write E2E test: tapping outside popup dismisses it; tapping user-sent message word also works; word with no translation shows "No translation found" in `tests/e2e/us3-word-lookup.spec.ts`

### Implementation for User Story 3

- [X] T046 [P] [US3] Implement `src/components/chat/WordPopup.vue` — positioned popup showing `pinyin`, `translation`, and optional "No translation found" fallback; emits `dismiss`; accepts `wordTranslation: WordTranslation | null` and `loading: boolean`
- [X] T047 [US3] Upgrade `src/components/chat/ChatMessage.vue` for word segmentation — use `segmenter.ts` to split `content` into `<span>` elements for Chinese-script segments; attach tap handler per span; on tap: look up index in `message.wordTranslations`; show `WordPopup`; show loading shimmer while `wordTranslationStatus === 'pending'`; show "Translation unavailable" if `wordTranslationStatus === 'error'`
- [X] T048 [US3] Wire `translateMessage()` call in `src/views/ChatView.vue` — fires sequentially after assistant message is received; stores result via `updateMessageWordTranslations()` in conversations store

**Checkpoint**: US3 complete — single-word lookup is live; US1 + US2 + US3 all functional

---

## Phase 6: User Story 4 — Multi-Word Phrase Lookup (Priority: P4)

**Goal**: Press-and-drag gesture over Chinese text in any message triggers on-demand phrase translation popup

**Independent Test**: In a conversation with Chinese text — press and drag over 2+ words → release → popup appears with combined phrase pinyin and translation

### E2E Tests for User Story 4 ⚠️ Write FIRST — must FAIL before implementation

- [X] T049 [US4] Write E2E test: press-and-drag over multiple Chinese words and release shows phrase popup with pinyin and translation in `tests/e2e/us4-phrase-lookup.spec.ts`
- [X] T050 [US4] Write E2E test: drag selection including punctuation only sends Chinese characters to lookup; dismissing popup clears selection in `tests/e2e/us4-phrase-lookup.spec.ts`

### Implementation for User Story 4

- [X] T051 [P] [US4] Implement drag gesture handler in `src/components/chat/ChatMessage.vue` — detect `pointerdown` + `pointermove` + `pointerup` sequence over Chinese spans; on release extract selected text, strip punctuation; if non-empty fire `translatePhrase()` and show `WordPopup` in loading state
- [X] T052 [US4] Implement `translatePhrase()` call integration in `src/components/chat/ChatMessage.vue` — calls `openrouter.translatePhrase(selectedText)`; on resolve populates `WordPopup`; on error shows "Translation unavailable"; cancels in-flight call if popup dismissed before response

**Checkpoint**: US4 complete — phrase lookup extends word lookup; US1–4 all functional

---

## Phase 7: User Story 5 — Message Feedback (Grammar and Correction) (Priority: P5)

**Goal**: Feedback icon on every sent user message — green (correct) or red (errors); tapping opens correction dialog with character-level diff

**Independent Test**: Send grammatically correct Chinese message → green icon appears ≤5 s; send message with deliberate error → red icon appears; tap red icon → diff dialog shows wrong chars in red, added chars in green

### E2E Tests for User Story 5 ⚠️ Write FIRST — must FAIL before implementation

- [X] T053 [US5] Write E2E test: sending a Chinese message shows loading indicator on bubble; correct message resolves to green icon; incorrect message resolves to red icon in `tests/e2e/us5-message-feedback.spec.ts`
- [X] T054 [US5] Write E2E test: tapping green icon opens dialog with English translation; tapping red icon opens diff dialog with wrong chars red and added chars green; dismissing closes dialog in `tests/e2e/us5-message-feedback.spec.ts`
- [X] T055 [US5] Write E2E test: feedback call failure shows error icon state without affecting the displayed chat reply in `tests/e2e/us5-message-feedback.spec.ts`

### Implementation for User Story 5

- [X] T056 [P] [US5] Implement `src/components/chat/FeedbackIcon.vue` — shows green ✓, red ✗, grey loading spinner, or grey ⚠ error state based on `feedbackStatus` and `feedback.isCorrect`; emits `tap`
- [X] T057 [P] [US5] Implement `src/components/chat/TranslationDialog.vue` — modal dialog showing English translation (`feedback.translation`); shown when `isCorrect === true`; emits `dismiss`
- [X] T058 [P] [US5] Implement `src/components/chat/CorrectionDialog.vue` — modal dialog showing original message on top and corrected on bottom; uses `diff.ts diffChars()` to render character-level diff with wrong/replaced chars in red and added chars in green; shown when `isCorrect === false`; emits `dismiss`
- [X] T059 [US5] Integrate `FeedbackIcon` into `src/components/chat/ChatMessage.vue` — render on user-role messages only; wire to `message.feedbackStatus` and `message.feedback`; on tap open `TranslationDialog` or `CorrectionDialog` based on `isCorrect`
- [X] T060 [US5] Verify `grammarFeedback()` call in `src/views/ChatView.vue` fires in parallel with `chatReply()` on user message send; result stored via `updateMessageFeedback()` in conversations store; error sets `feedbackStatus: 'error'`

**Checkpoint**: US5 complete — full grammar feedback loop; all 5 user stories functional

---

## Phase 8: Settings Screen

**Purpose**: API key entry + context window + per-action model configuration (required by FR-014, FR-015, FR-016, FR-017)

### E2E Tests for Settings Screen ⚠️ Write FIRST — must FAIL before implementation

- [X] T061a [P] Write E2E test: settings screen renders API key input, context window slider, and four model string inputs; saving API key stores it via credentials service (mock credential API in Playwright); changing context window persists after reload in `tests/e2e/us-settings.spec.ts`

### Implementation

- [X] T061 Write failing unit tests for `SettingsView` (renders API key input, saves via credentials service, shows context window slider, shows four model inputs, persists settings) in `tests/unit/stores/settings.test.ts`
- [X] T062 Implement `src/views/SettingsView.vue` — input for OpenRouter API key with save button (calls `credentials.saveApiKey()`); number input for context window size N (range 1–50, default 8) wired to `settings` store; four text inputs for per-action model strings (`chatModel`, `feedbackModel`, `translationModel`, `phraseLookupModel`) defaulting to `deepseek/deepseek-v3.2` for chat/feedback and `openai/gpt-oss-120b` for translation/phrase lookup, all wired to `settings` store; error message if Credential Management API unavailable; no localStorage fallback for API key
- [X] T062a Wire `settings.contextWindowSize` into message-window slice — `openrouter.chatReply()` MUST accept `contextWindowSize` as a parameter (or read from settings store) and slice the last N messages accordingly; add a unit test in `tests/unit/services/openrouter.test.ts` asserting slice length matches N; add a unit test in `tests/unit/stores/settings.test.ts` verifying the value is applied when changed (FR-016)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, performance, and final validation

### Error-Path E2E Tests ⚠️ Constitution III mandate — critical error paths must have E2E coverage

- [X] T062b [P] Write E2E test: AI endpoint unreachable (mock returns network error) → inline retry error shown on message bubble; tapping retry re-fires the call in `tests/e2e/error-paths.spec.ts`
- [X] T062c [P] Write E2E test: feedback call fails but chat reply succeeds → error icon shown on message bubble, AI reply displayed normally in `tests/e2e/error-paths.spec.ts`
- [X] T062d [P] Write E2E test: no API key stored → sending a message redirects to `/settings?reason=no-key` with explanatory message in `tests/e2e/error-paths.spec.ts`

### Implementation

- [X] T063 [P] Implement "no API key" guard in `src/views/ChatView.vue` — before any LLM call check `credentials.getApiKey()`; if null redirect to `/settings` with query param `?reason=no-key`; show explanatory message in `SettingsView` when param present (FR-015)
- [X] T064 [P] Implement "Credential Management API unavailable" error in `src/views/SettingsView.vue` — check `isCredentialApiAvailable()` on mount; if false show informational banner explaining the browser limitation (FR-014 constraint)
- [X] T065 [P] Handle orphaned conversations in `src/views/HomeView.vue` — when `conversation.personaId` references a deleted persona, display "Deleted persona" placeholder text and fallback avatar
- [X] T066 [P] Implement non-Chinese message graceful degradation — in `ChatMessage.vue` if content contains no Chinese characters, skip segmenter and disable word-tap; in feedback result, show "N/A — not Chinese text" state rather than error
- [X] T067 [P] Add retry button to failed chat reply message bubbles in `src/components/chat/ChatMessage.vue` — emits `retry(messageId)` event; `ChatView` re-fires `chatReply()` on retry
- [X] T068 [P] Ensure chat scroll behaviour in `src/views/ChatView.vue` — auto-scroll to bottom on new message; maintain scroll position when history is loaded; `ChatMessage` list must remain performant at 500+ messages
- [X] T069 Implement storage quota error handling in `src/stores/conversations.ts` — catch `QuotaExceededError` on localStorage write; surface to UI via a reactive `storageError` ref; `ChatView` shows notification and aborts the message send
- [X] T070 [P] Mobile-first CSS audit — verify all views (HomeView, ChatView, PersonaListView, SettingsView) are usable at 375px viewport width without horizontal scroll; test on `mobile-iphone` Playwright project
- [X] T071 Run full quickstart.md validation checklist — `npm run test:unit:run`, `npm run build && npm run test:e2e`, open `dist/index.html` via `file://`, verify no API key in localStorage, verify credential in DevTools Passwords, verify offline navigation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; tasks T003–T008 can run in parallel after T001–T002
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 — MVP slice; no dependency on US2–5
- **US2 (Phase 4)**: Depends on Phase 2; integrates with US1 `PersonaCard` and `personas` store
- **US3 (Phase 5)**: Depends on Phase 2 and US1 (ChatMessage, conversations store with wordTranslations); requires `translateMessage()` wired in ChatView
- **US4 (Phase 6)**: Depends on US3 (WordPopup, drag gesture base in ChatMessage)
- **US5 (Phase 7)**: Depends on Phase 2 and US1 (ChatView parallel call wiring, conversations store feedback fields)
- **Settings (Phase 8)**: Depends on Phase 2; can be implemented in parallel with any user story phase
- **Polish (Phase 9)**: Depends on all user story phases being complete

### User Story Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (Foundational)
        ├─► Phase 3 (US1) ─── MVP; no story deps
        ├─► Phase 4 (US2) ─── integrates US1 components
        ├─► Phase 3 (US1) ─► Phase 5 (US3) ─► Phase 6 (US4)
        ├─► Phase 3 (US1) ─► Phase 7 (US5)
        └─► Phase 8 (Settings) — parallel with any US phase
              └─► Phase 9 (Polish)
```

### Within Each User Story

1. E2E tests written first and committed (must FAIL)
2. Parallel [P] implementation tasks (components, services)
3. Sequential integration tasks (wiring into views/stores)
4. E2E must PASS against `vite build` output before story is marked complete

---

## Parallel Execution Examples

### Phase 2 Foundational (run all in parallel after Phase 1)

```
T009+T010 (credentials service)     ─┐
T011+T012 (openrouter service)       ├─ all independent files
T013+T014 (segmenter service)        │
T015+T016 (diff service)             │
T017+T018 (personas store)           │
T019+T020 (conversations store)      │
T021+T022 (settings store)          ─┘
T023 (main.ts) — after stores done
T024 (router) — parallel with T023
```

### Phase 3 US1 (after E2E tests T025–T028 are written and failing)

```
T029 (AvatarPlaceholder) ─┐
T030 (PersonaCard)         ├─ parallel (different files)
T033 (ChatInput)           │
T034 (ChatMessage subset) ─┘
T031 (PersonaPicker) — after T030
T032 (HomeView) — after T031, T029
T035 (ChatView) — after T033, T034
T036 (App.vue) — parallel with views
```

### Phase 5 US3 (after E2E tests T044–T045 are written and failing)

```
T046 (WordPopup) ─┐ parallel
T048 (translateMessage wire) — after T046
T047 (ChatMessage word segmentation) — after T046, T048
```

### Phase 7 US5 (after E2E tests T053–T055 are written and failing)

```
T056 (FeedbackIcon)        ─┐
T057 (TranslationDialog)    ├─ parallel (different files)
T058 (CorrectionDialog)    ─┘
T059 (ChatMessage integrate FeedbackIcon) — after T056, T057, T058
T060 (ChatView feedback wiring verify) — after T059
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (including E2E tests passing)
4. **STOP and VALIDATE**: Run `npm run build && npm run test:e2e`
5. Demo/deploy — app is usable with a default persona

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Working chat MVP ✓ demo
3. Phase 4 (US2) → Full persona management ✓ demo
4. Phase 8 (Settings) → Production-ready API key UX ✓
5. Phase 5 (US3) → Word lookup live ✓
6. Phase 6 (US4) → Phrase lookup live ✓
7. Phase 7 (US5) → Grammar feedback live ✓ full feature complete
8. Phase 9 (Polish) → Production hardening ✓

### TDD Gate (Per Constitution)

For every feature task:
1. Write failing test → commit
2. Implement minimum code to pass → commit
3. Refactor → keep green
4. Before marking story complete: `npm run build && npm run test:e2e` MUST pass

---

## Notes

- **OpenRouter API in tests**: Unit tests mock `fetch` via `vi.fn()`; E2E tests intercept `https://openrouter.ai/api/v1/chat/completions` using Playwright `page.route()` via the shared `mockOpenRouter()` fixture in `tests/e2e/fixtures/openrouter.ts` — no real network calls or API key required in CI; manual validation (quickstart.md) uses the real endpoint
- [P] tasks = different files, no dependencies within the phase — safe to run in parallel
- [Story] label maps each task to its user story for traceability
- E2E tests are written before any implementation in that story starts (TDD constitution mandate)
- `crypto.randomUUID()` for all entity IDs — no external UUID library needed
- API key MUST use Credential Management API; no localStorage fallback; tests must verify absence of key in localStorage
- `Intl.Segmenter` is used for Chinese tokenisation — no WASM or external dictionary library
- `jsdiff diffChars()` is used for correction diff — no custom LCS implementation
- Profile images resized client-side via Canvas API before storage; max 200 KB per image
- Stop at any checkpoint to validate the story independently before proceeding
