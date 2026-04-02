# Tasks: Chinese AI Tandem Chat

**Input**: Design documents from `/specs/001-chinese-tandem-chat/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Required — TDD is a constitution mandate for this project. Write failing tests before each implementation task.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US5)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffold, dependencies, config, shared type definitions

- [x] T001 Verify project scaffold matches quickstart.md: package.json scripts, TypeScript strict mode, Vue 3 + Vite + Pinia + Vue Router + Vitest + Playwright
- [x] T002 Install additional dependencies: `pinia-plugin-persistedstate`, `diff`; devDeps: `@testing-library/vue`, `@testing-library/jest-dom`, `@testing-library/user-event`, `happy-dom`
- [x] T003 [P] Configure `vitest.config.ts` with happy-dom environment and setup file; create `tests/unit/setup.ts` with `@testing-library/jest-dom` matchers and `cleanup()` afterEach
- [x] T004 [P] Configure `playwright.config.ts` with `testDir: ./tests/e2e`, `baseURL: http://localhost:4173`, webServer using `npm run build && npm run preview` in CI, chromium and mobile-iphone projects
- [x] T005 [P] Create directory structure: `src/components/{chat,persona,common}/`, `src/views/`, `src/stores/`, `src/services/`, `src/router/`, `src/types/`, `tests/unit/{stores,services}/`, `tests/e2e/fixtures/`
- [x] T006 Define all TypeScript interfaces in `src/types/index.ts`: `Persona` (createdAt: Date), `Conversation` (createdAt/updatedAt: Date, messages: Message[]), `BaseMessage` (timestamp: Date), `UserMessage extends BaseMessage` (feedback, feedbackStatus), `PersonaMessage extends BaseMessage` (annotatedWords: AnnotatedWord[] | null, wordTranslationStatus), `Message = UserMessage | PersonaMessage`, `FeedbackResult`, `WordTranslation` (word, pinyin, translation — no startIndex), `AnnotatedWord` (word, pinyin: string | null, translation: string | null), `AppSettings` (apiKey: string | null, contextWindowSize, 4 model strings)
- [x] T007 [P] Configure pinia-plugin-persistedstate in `src/main.ts` with custom Date deserialiser: JSON.parse reviver that converts ISO 8601 strings back to Date objects on store hydration
- [x] T008 [P] Create `src/App.vue` shell with `<RouterView>` and minimal layout
- [x] T009 [P] Create `tests/e2e/fixtures/openrouter.ts` — Playwright route fixture that intercepts `POST https://openrouter.ai/api/v1/chat/completions` and returns canned JSON responses per call type: chat reply, grammar feedback (structured JSON), word translation (structured JSON `words` array without startIndex), phrase lookup; export helper `mockOpenRouter(page, overrides?)`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services and stores that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational Phase

> **Write FIRST, ensure they FAIL before implementation**

- [x] T010 [P] Unit test for credentials service in `tests/unit/services/credentials.test.ts`: test `loadApiKey()` returns key from mocked PasswordCredential, returns null when unavailable, `saveApiKey()` stores credential, `isCredentialApiAvailable()` returns boolean
- [x] T011 [P] Unit test for settings store in `tests/unit/stores/settings.test.ts`: test `init()` loads API key via credentials service into reactive state, `apiKey` excluded from localStorage persistence, default values for contextWindowSize (8) and model strings (deepseek/deepseek-v3.2 for chat/feedback, google/gemini-2.5-flash-lite for translation/phrase), Date deserialisation on hydration
- [x] T012 [P] Unit test for openrouter base service in `tests/unit/services/openrouter.test.ts`: test `chatReply()` reads apiKey from settings store, sends correct payload per `openrouter-chat.md` contract with sliding window of last N messages, handles errors (network, 4xx, 5xx, empty choices)
- [x] T013 [P] Unit test for personas store in `tests/unit/stores/personas.test.ts`: test `addPersona()` generates UUID + Date, `getById()`, persistence to localStorage key `han-chat-personas`, Date hydration (createdAt revived as Date)
- [x] T014 [P] Unit test for conversations store in `tests/unit/stores/conversations.test.ts`: test `createConversation()` generates UUID + Date, `addMessage()` appends to `conversation.messages[]` and updates `updatedAt`, `getConversation()`, Date hydration (createdAt/updatedAt/timestamp revived as Date), persistence to `han-chat-conversations`
- [x] T015 [P] Unit test for router in `tests/unit/router/router.test.ts`: test routes exist for `/`, `/chat/:id`, `/personas`, `/personas/new`, `/settings`

### Implementation for Foundational Phase

- [x] T016 [P] Implement credentials service in `src/services/credentials.ts`: `loadApiKey(): Promise<string | null>`, `saveApiKey(key: string): Promise<void>`, `isCredentialApiAvailable(): boolean` — wrapping PasswordCredential API
- [x] T017 [P] Implement personas store in `src/stores/personas.ts`: `defineStore` setup syntax, `personas: Persona[]`, `addPersona()` (generates id via crypto.randomUUID(), createdAt via new Date()), `getById()`, persist to `han-chat-personas` with Date serialiser
- [x] T018 Implement settings store in `src/stores/settings.ts`: `defineStore` setup syntax, `apiKey: string | null` (in-memory only, excluded from persist paths), `contextWindowSize` (default 8), 4 model strings, `init()` action calling `loadApiKey()` from credentials service, persist to `han-chat-settings` with `paths` excluding `apiKey`
- [x] T019 Implement conversations store in `src/stores/conversations.ts`: `defineStore` setup syntax, `conversations: Conversation[]` (each embedding `messages: Message[]`), `createConversation(personaId)`, `addMessage(conversationId, message)` — updates `conversation.updatedAt`, `getConversation(id)`, `allConversationsSorted` computed (by updatedAt desc), `updateMessageFeedback()`, `updateMessageTranslations()`, persist to `han-chat-conversations` with Date serialiser
- [x] T020 Implement openrouter base service in `src/services/openrouter.ts`: shared `callOpenRouter()` helper reading `apiKey` from settings store (never calling Credential API directly), error handling for network/4xx/5xx, `chatReply()` per `openrouter-chat.md` contract with sliding window of `settings.contextWindowSize` messages
- [x] T021 Implement Vue Router in `src/router/index.ts`: routes for `/` (HomeView), `/chat/:id` (ChatView), `/personas` (PersonaListView), `/personas/new` (PersonaForm), `/settings` (SettingsView)

**Checkpoint**: Foundation ready — stores persist with Date hydration, API key loaded at startup, openrouter service reads key from store, routes defined

---

## Phase 3: User Story 1 — Persona Selection and Conversation Start (Priority: P1) MVP

**Goal**: Home screen lists conversations; user picks a persona to start a new conversation; chat screen shows messages and receives AI replies via OpenRouter

**Independent Test**: Open app with no data → see empty state → create persona (inline for MVP) → start conversation → send message → receive AI reply

### E2E Tests for User Story 1

> **Write FIRST. Must FAIL before implementation begins.**

- [x] T022 [US1] E2E test in `tests/e2e/us1-conversation-start.spec.ts`: AS1 — empty state shows empty list + "New conversation" + "New persona" buttons; AS2 — tap "New conversation" shows persona picker; AS3 — select persona opens chat with name visible; AS4 — send message and receive AI reply (mock OpenRouter via `mockOpenRouter(page)`); AS5 — home screen lists conversations with persona name, preview, timestamp; AS6 — tap conversation restores chat history

### Unit Tests for User Story 1

- [x] T023 [P] [US1] Unit test for HomeView in `tests/unit/views/HomeView.test.ts`: renders empty state, renders conversation list sorted by updatedAt, navigation to chat on click
- [x] T024 [P] [US1] Unit test for ChatView message send flow in `tests/unit/views/ChatView.test.ts`: sends user message (UserMessage with feedbackStatus null), calls `chatReply()`, appends PersonaMessage (with wordTranslationStatus null), displays both messages
- [x] T025 [P] [US1] Unit test for ChatInput in `tests/unit/components/chat/ChatInput.test.ts`: emits `send` event with text, clears input after send, disabled when empty
- [x] T026 [P] [US1] Unit test for ChatMessage in `tests/unit/components/chat/ChatMessage.test.ts`: renders user message (right-aligned), renders assistant message (left-aligned), shows persona name
- [x] T027 [P] [US1] Unit test for PersonaPicker in `tests/unit/components/persona/PersonaPicker.test.ts`: lists all personas, emits selection event with personaId
- [x] T028 [P] [US1] Unit test for AvatarPlaceholder in `tests/unit/components/common/AvatarPlaceholder.test.ts`: renders initials when no avatarDataUri, renders `<img>` when provided

### Implementation for User Story 1

- [x] T029 [P] [US1] Implement AvatarPlaceholder in `src/components/common/AvatarPlaceholder.vue`: accepts `name` and `avatarDataUri` props, renders initials fallback or `<img>`
- [x] T030 [P] [US1] Implement ChatInput in `src/components/chat/ChatInput.vue`: text input with send button, emits `send` event, clears on send, disabled when empty
- [x] T031 [P] [US1] Implement ChatMessage (US1 subset) in `src/components/chat/ChatMessage.vue`: renders message bubble with content, timestamp, role-based alignment (user right, assistant left), avatar — no word spans or feedback icon yet
- [x] T032 [P] [US1] Implement PersonaCard in `src/components/persona/PersonaCard.vue`: displays persona avatar (or AvatarPlaceholder), name; emits `select`
- [x] T033 [US1] Implement PersonaPicker in `src/components/persona/PersonaPicker.vue`: modal overlay listing all personas via PersonaCard; emits `picked(personaId)` and `cancel`
- [x] T034 [US1] Implement HomeView in `src/views/HomeView.vue`: lists conversations (sorted by updatedAt desc) with persona name + last message preview + timestamp, "New conversation" button → PersonaPicker, "New persona" button → /personas/new, tap conversation → /chat/:id, empty state UI
- [x] T035 [US1] Implement ChatView in `src/views/ChatView.vue`: loads conversation by route param, renders message list with ChatMessage, ChatInput at bottom, on send: creates UserMessage (feedback: null, feedbackStatus: null) and adds to conversation.messages, calls `chatReply()` → creates PersonaMessage (annotatedWords: null, wordTranslationStatus: null) and adds to conversation.messages, auto-scroll to bottom
- [x] T036 [US1] Add API key guard in ChatView: if `settingsStore.apiKey` is null when user tries to send, redirect to `/settings` with toast message explaining they need to set their API key
- [x] T037 [US1] Seed default persona on first run (if personas store is empty): name "Chinese Tutor", systemPrompt "You are a friendly Chinese language tutor. Respond in Simplified Chinese. Keep responses concise and conversational."

**Checkpoint**: MVP complete — user can create conversations, send messages, receive AI replies, all persisted with Date objects across reloads

---

## Phase 4: User Story 2 — Persona Creation and Management (Priority: P2)

**Goal**: Full persona creation form with name, system prompt, and optional profile image upload with client-side resize

**Independent Test**: Create persona with name + image + prompt → verify in persona list → start conversation → AI uses system prompt

### E2E Tests for User Story 2

- [x] T038 [US2] E2E test in `tests/e2e/us2-persona-management.spec.ts`: AS1 — form shows fields for name, image, system prompt; AS2 — save persona persists and shows in list; AS3 — image upload shows preview; AS4 — persona system prompt used in conversation (verify via mockOpenRouter); AS5 — no-image persona shows placeholder

### Unit Tests for User Story 2

- [x] T039 [P] [US2] Unit test for PersonaForm in `tests/unit/components/persona/PersonaForm.test.ts`: validates name (>1 char), validates systemPrompt (1–2000 chars), image upload triggers resize, emits save with Persona data
- [x] T040 [P] [US2] Unit test for image resize utility in `tests/unit/services/image-resize.test.ts`: resizes image to ≤ 200 KB data URI, preserves aspect ratio, handles invalid input

### Implementation for User Story 2

- [x] T041 [P] [US2] Implement image resize utility in `src/services/image-resize.ts`: accepts File, returns data URI string ≤ 200 KB via Canvas API resize
- [x] T042 [US2] Implement PersonaForm in `src/components/persona/PersonaForm.vue`: name input (>1 char), system prompt textarea (1–2000 chars), image file input → resize → preview, save button calls `personasStore.addPersona()`
- [x] T043 [US2] Implement PersonaListView in `src/views/PersonaListView.vue`: lists all personas with PersonaCard, "New persona" button → /personas/new, tap persona → start new conversation
- [x] T044 [US2] Wire PersonaForm route: `/personas/new` renders PersonaForm, on save navigate back to persona list

**Checkpoint**: Full persona creation operational with image resize

---

## Phase 5: User Story 3 — Single-Word Lookup (Priority: P3)

**Goal**: Tap any Chinese word in an assistant message to see pinyin + translation popup. Pre-fetched via LLM on message arrival, matched to text via AnnotatedWord algorithm.

**Independent Test**: Open conversation with Chinese assistant messages → tap a word → popup shows pinyin + translation

**Depends on**: US1 (needs PersonaMessage to exist)

### E2E Tests for User Story 3

- [x] T045 [US3] E2E test in `tests/e2e/us3-word-lookup.spec.ts`: AS1 — tap word in assistant message shows pinyin + translation popup; AS2 — dismiss popup on tap outside; AS3 — "No translation found" for untranslatable words; AS4 — only assistant messages are tappable (user messages not tappable)

### Unit Tests for User Story 3

- [x] T046 [P] [US3] Unit test for `matchTranslationsToText()` in `tests/unit/services/translation-matcher.test.ts`: exact word match, punctuation skipping (CJK + ASCII), LLM double-word skip, unmatched chars get `null` pinyin/translation, empty input, mixed Chinese + punctuation text
- [x] T047 [P] [US3] Unit test for `isPunctuation()` in `tests/unit/services/translation-matcher.test.ts`: CJK punctuation (。，！？、), ASCII punctuation (.,!? ), spaces, non-punctuation returns false
- [x] T048 [P] [US3] Unit test for `translateMessage()` in `tests/unit/services/openrouter.test.ts`: sends correct payload per `openrouter-translation.md` contract (system prompt about splitting words, user prompt with quoted text, json_schema with word/pinyin/translation — no startIndex), parses WordTranslation[] from response, calls `matchTranslationsToText()` to produce AnnotatedWord[], handles errors
- [x] T049 [P] [US3] Unit test for WordPopup in `tests/unit/components/chat/WordPopup.test.ts`: renders pinyin + translation, positions near tapped word, dismisses on outside click, shows "No translation found" when pinyin is null
- [x] T050 [P] [US3] Unit test for ChatMessage with AnnotatedWord rendering in `tests/unit/components/chat/ChatMessage.test.ts`: PersonaMessage renders word spans from annotatedWords, each tappable span triggers WordPopup, UserMessage has no word spans

### Implementation for User Story 3

- [x] T051 [P] [US3] Implement `isPunctuation()` and `matchTranslationsToText()` in `src/services/translation-matcher.ts` per data-model.md algorithm: iterates text chars, matches against WordTranslation queue, handles punctuation/exact match/double-word skip/unmatched fallback, returns AnnotatedWord[]
- [x] T052 [US3] Implement `translateMessage()` in `src/services/openrouter.ts`: sends translation request per `openrouter-translation.md` contract (updated system/user prompts, no startIndex in schema), parses WordTranslation[], calls `matchTranslationsToText()`, returns AnnotatedWord[]
- [x] T053 [US3] Implement WordPopup in `src/components/chat/WordPopup.vue`: accepts `word`, `pinyin`, `translation` props (nullable), positioned absolutely near trigger element, close on outside click/Escape, "No translation found" when null, optional loading spinner
- [x] T054 [US3] Extend ChatMessage for PersonaMessage word rendering in `src/components/chat/ChatMessage.vue`: when `message.role === 'assistant'` and `annotatedWords` resolved, render content as `<span>` per AnnotatedWord, attach tap handler → show WordPopup, shimmer loading while `wordTranslationStatus === 'pending'`, "Translation unavailable" if `wordTranslationStatus === 'error'`
- [x] T055 [US3] Wire translation pre-fetch in ChatView `src/views/ChatView.vue`: after `chatReply()` resolves and PersonaMessage added, call `translateMessage()` → store AnnotatedWord[] on `PersonaMessage.annotatedWords` via `conversationsStore.updateMessageTranslations()`, handle error → set `wordTranslationStatus: 'error'`

**Checkpoint**: Single-word lookup fully functional on all assistant messages

---

## Phase 6: User Story 4 — Multi-Word Phrase Lookup (Priority: P4)

**Goal**: Press-and-drag over Chinese text in assistant messages to see combined pinyin + translation for the selected phrase

**Independent Test**: Drag over 2+ words in assistant message → popup with phrase pinyin + translation

**Depends on**: US3 (extends the word-tap interaction pattern and WordPopup)

### E2E Tests for User Story 4

- [x] T056 [US4] E2E test in `tests/e2e/us4-phrase-lookup.spec.ts`: AS1 — drag selection shows phrase popup with pinyin + translation; AS2 — punctuation excluded from lookup text; AS3 — dismiss popup clears selection

### Unit Tests for User Story 4

- [x] T057 [P] [US4] Unit test for `translatePhrase()` in `tests/unit/services/openrouter.test.ts`: sends correct payload per `openrouter-phrase-lookup.md` contract, strips punctuation from input, parses phrase/pinyin/translation, handles errors
- [x] T058 [P] [US4] Unit test for phrase drag interaction in `tests/unit/components/chat/ChatMessage.test.ts`: pointerdown + pointermove + pointerup across AnnotatedWord spans produces selected text, popup shown on release with loading then result

### Implementation for User Story 4

- [x] T059 [US4] Implement `translatePhrase()` in `src/services/openrouter.ts` per `openrouter-phrase-lookup.md` contract: strip punctuation from input, send request, parse response
- [x] T060 [US4] Extend ChatMessage with drag-select in `src/components/chat/ChatMessage.vue`: pointerdown/pointermove/pointerup handlers on AnnotatedWord spans, collect selected text, strip punctuation, on release call `translatePhrase()`, show WordPopup in loading → result, cancel in-flight on dismiss
- [x] T061 [US4] Extend WordPopup for phrase mode in `src/components/chat/WordPopup.vue`: accept optional `loading` prop, show spinner while phrase lookup in progress, display phrase + pinyin + translation on resolve

**Checkpoint**: Both single-word tap and multi-word drag lookup fully functional

---

## Phase 7: User Story 5 — Message Feedback (Priority: P5)

**Goal**: Grammar feedback on user messages — green/red icon, correction diff dialog with character-level highlighting

**Independent Test**: Send correct Chinese → green icon → tap shows translation; Send incorrect Chinese → red icon → tap shows diff dialog

**Depends on**: US1 (needs UserMessage in conversation)

### E2E Tests for User Story 5

- [x] T062 [US5] E2E test in `tests/e2e/us5-message-feedback.spec.ts`: AS1 — feedback icon appears (green/red) after send; AS2 — green icon tap shows translation dialog; AS3 — red icon tap shows diff dialog with red/green highlighting; AS4 — dismiss dialog; AS5 — loading indicator while pending

### Unit Tests for User Story 5

- [x] T063 [P] [US5] Unit test for `grammarFeedback()` in `tests/unit/services/openrouter.test.ts`: sends correct payload per `openrouter-feedback.md` contract, parses FeedbackResult (camelCase normalisation from is_correct), handles errors
- [x] T064 [P] [US5] Unit test for diff service in `tests/unit/services/diff.test.ts`: `computeDiff()` returns array of `{value, added?, removed?}` from jsdiff `diffChars()`, Chinese character diffs work correctly, identical strings produce single unchanged segment
- [x] T065 [P] [US5] Unit test for FeedbackIcon in `tests/unit/components/chat/FeedbackIcon.test.ts`: green icon when `isCorrect`, red icon when not, loading spinner when `feedbackStatus === 'pending'`, error icon when `feedbackStatus === 'error'`, emits click
- [x] T066 [P] [US5] Unit test for CorrectionDialog in `tests/unit/components/chat/CorrectionDialog.test.ts`: green mode shows translation only, red mode shows original + corrected with diff spans (red `.removed`, green `.added`), dismiss emits close

### Implementation for User Story 5

- [x] T067 [P] [US5] Implement diff service in `src/services/diff.ts`: `computeDiff(original, corrected)` wrapping jsdiff `diffChars()`, returns typed array of `{value, type: 'equal'|'added'|'removed'}`
- [x] T068 [P] [US5] Implement `grammarFeedback()` in `src/services/openrouter.ts` per `openrouter-feedback.md` contract: fixed grammar teacher system prompt, single user message, parses FeedbackResult with camelCase normalisation
- [x] T069 [P] [US5] Implement FeedbackIcon in `src/components/chat/FeedbackIcon.vue`: green/red/loading/error states based on `feedbackStatus` and `feedback.isCorrect`, emits click
- [x] T070 [US5] Implement CorrectionDialog in `src/components/chat/CorrectionDialog.vue`: green mode (translation only), red mode (original on top, corrected on bottom with diff spans — red `.removed`, green `.added`), dismiss button/overlay
- [x] T071 [US5] Wire feedback call in ChatView `src/views/ChatView.vue`: on user message send, fire `grammarFeedback()` in parallel with `chatReply()` (independent promises, NOT Promise.all), store FeedbackResult on UserMessage via `conversationsStore.updateMessageFeedback()`, handle errors independently → set `feedbackStatus: 'error'`
- [x] T072 [US5] Extend ChatMessage for UserMessage feedback in `src/components/chat/ChatMessage.vue`: when `message.role === 'user'`, show FeedbackIcon, tap icon → open CorrectionDialog with feedback data + original content

**Checkpoint**: Full grammar feedback loop — send message → see icon → tap for details

---

## Phase 8: Settings Screen

**Purpose**: API key entry + context window + per-action model configuration (FR-014, FR-015, FR-016, FR-017)

### E2E Tests for Settings

- [x] T073 [P] E2E test in `tests/e2e/settings.spec.ts`: settings screen renders API key input, context window slider, and four model string inputs; saving persists after reload; API key saved via credentials service (mock)

### Unit Tests for Settings

- [x] T074 [P] Unit test for SettingsView in `tests/unit/views/SettingsView.test.ts`: renders all inputs, saves API key via credentials service, context window validates range 1–50, model inputs show defaults

### Implementation for Settings

- [x] T075 Implement SettingsView in `src/views/SettingsView.vue`: API key input + save (calls `credentials.saveApiKey()` and updates `settingsStore.apiKey`), context window slider (1–50, default 8), 4 model string inputs (defaults: deepseek/deepseek-v3.2 for chat/feedback, google/gemini-2.5-flash-lite for translation/phrase), Credential API unavailable banner, toast on successful save

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, performance, and final validation

### Error-Path E2E Tests

- [x] T076 [P] E2E test in `tests/e2e/error-paths.spec.ts`: AI endpoint unreachable → inline retry error on message bubble
- [x] T077 [P] E2E test in `tests/e2e/error-paths.spec.ts`: feedback call fails but chat reply succeeds → error icon, AI reply displayed normally
- [x] T078 [P] E2E test in `tests/e2e/error-paths.spec.ts`: no API key stored → sending message redirects to `/settings` with toast message

### Implementation

- [x] T079 [P] Implement retry button on failed chat reply in `src/components/chat/ChatMessage.vue`: emits `retry(messageId)`, ChatView re-fires `chatReply()`
- [x] T080 [P] Handle Credential Management API unavailable: persistent banner in `src/App.vue` when `!isCredentialApiAvailable()`
- [x] T081 [P] Handle non-Chinese message gracefully: skip word segmentation + disable tap in ChatMessage, feedback shows "N/A — not Chinese text"
- [x] T082 [P] Handle orphaned conversations in HomeView: when `personaId` references missing persona, show "Deleted persona" placeholder
- [x] T083 Ensure chat scroll in ChatView: auto-scroll to bottom on new message, remain performant at 500+ messages
- [x] T084 [P] Handle storage quota error in conversations store: catch `QuotaExceededError`, surface via reactive ref, ChatView shows notification
- [x] T085 [P] Mobile-first CSS audit: all views usable at 375px, touch targets ≥ 44px
- [x] T086 Run quickstart.md validation: `npm run test:unit:run`, `npm run build && npm run test:e2e`, `file://` loads, no API key in localStorage, offline navigation works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational — can run parallel to US1
- **US3 (Phase 5)**: Depends on US1 (needs PersonaMessage)
- **US4 (Phase 6)**: Depends on US3 (extends word-tap + WordPopup)
- **US5 (Phase 7)**: Depends on US1 (needs UserMessage) — can run parallel to US3/US4
- **Settings (Phase 8)**: Depends on Foundational — can run parallel to any story
- **Polish (Phase 9)**: Depends on all stories complete

### User Story Dependencies

```
Phase 1 (Setup)
  └─▶ Phase 2 (Foundational)
        ├─▶ Phase 3 (US1 - MVP) ─────┬─▶ Phase 5 (US3 - Word Lookup) ─▶ Phase 6 (US4 - Phrase Lookup)
        │                             │
        │                             └─▶ Phase 7 (US5 - Feedback)
        │
        ├─▶ Phase 4 (US2 - Personas) [parallel to US1]
        │
        └─▶ Phase 8 (Settings) [parallel to any story]
                                          │
                                          └───────────────────────────▶ Phase 9 (Polish)
```

### Within Each User Story

1. E2E tests MUST be written and FAIL before implementation
2. Unit tests MUST be written and FAIL before implementation
3. Services/utilities before components
4. Components before views
5. Views integrate everything
6. Story complete → checkpoint → next priority

### Parallel Opportunities

**Phase 1**: T003, T004, T005, T007, T008, T009 can all run in parallel (after T001–T002)
**Phase 2 tests**: T010–T015 can all run in parallel
**Phase 2 impl**: T016, T017 parallel; T018 after T016 (needs credentials); T019 after T017; T020 after T018 (needs settings store for apiKey)
**US1 unit tests**: T023–T028 can all run in parallel
**US1 impl**: T029–T032 parallel; T033 after T032; T034, T035 after components
**US3 + US5**: Can run entirely in parallel (different files, different services)

---

## Parallel Example: User Story 1

```
# Unit tests (all parallel):
T023 (HomeView test), T024 (ChatView test), T025 (ChatInput test),
T026 (ChatMessage test), T027 (PersonaPicker test), T028 (AvatarPlaceholder test)

# Components (all parallel):
T029 (AvatarPlaceholder), T030 (ChatInput), T031 (ChatMessage), T032 (PersonaCard)

# Then sequential:
T033 (PersonaPicker) → T034 (HomeView) → T035 (ChatView) → T036 (API key guard) → T037 (default persona)
```

---

## Parallel Example: US3 + US5 Simultaneously

```
## US3 (Word Lookup):                   ## US5 (Feedback) — same time:
T051 (matchTranslationsToText)           T067 (diff service)
T052 (translateMessage)                  T068 (grammarFeedback)
T053 (WordPopup)                         T069 (FeedbackIcon)
T054 (ChatMessage word spans)            T070 (CorrectionDialog)
T055 (ChatView translation wire)         T071 (ChatView feedback wire)
                                         T072 (ChatMessage feedback icon)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `npm run build && npm run test:e2e`
5. Deploy — app is usable with basic chat

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Working chat MVP → Deploy
3. US2 → Enhanced persona management → Deploy
4. Settings → Production-ready API key UX
5. US3 → Word lookup adds learning value → Deploy
6. US5 → Grammar feedback adds correction value → Deploy
7. US4 → Phrase lookup extends learning → Deploy
8. Polish → Production-ready

### Solo Developer Path (Recommended)

1. Setup + Foundational → **validate stores persist with Date objects**
2. US1 + US2 together → **full persona + chat flow**
3. Settings → **API key UX complete**
4. US3 → **word lookup with AnnotatedWord matching**
5. US5 → **grammar feedback with diff** (can skip US4 initially)
6. US4 → **phrase drag extends lookup**
7. Polish → **error handling, mobile, performance**

### TDD Gate (Per Constitution)

For every feature task:
1. Write failing test → commit
2. Implement minimum code to pass → commit
3. Refactor → keep green
4. Before marking story complete: `npm run build && npm run test:e2e` MUST pass

---

## Notes

- **Data model changes reflected**: Messages use type hierarchy (BaseMessage/UserMessage/PersonaMessage); dates are native Date; messages embedded in Conversation; AnnotatedWord replaces old WordTranslation+startIndex approach; API key loaded once at startup into SettingsStore
- **OpenRouter API in tests**: Unit tests mock `fetch` via `vi.fn()`; E2E tests intercept via Playwright `page.route()` using `mockOpenRouter()` fixture — no real API calls in CI
- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to user story for traceability
- `crypto.randomUUID()` for all entity IDs
- API key MUST use Credential Management API; never localStorage; loaded once into settings store at app start
- `Intl.Segmenter` for Chinese tokenisation (no WASM)
- `jsdiff diffChars()` for correction diff
- Profile images resized via Canvas API before storage (max 200 KB)
- Stop at any checkpoint to validate story independently
