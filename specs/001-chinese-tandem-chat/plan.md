# Implementation Plan: Chinese AI Tandem Chat

**Branch**: `001-chinese-tandem-chat` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-chinese-tandem-chat/spec.md`

## Summary

A client-only Vue 3 SPA that lets Chinese language learners practice with
AI-powered personas via a chat interface. Key differentiators: per-word/phrase
pinyin+translation lookup (via pre-fetched LLM structured output), parallel
grammar-feedback call per sent message with a character-level diff dialog, and
all data stored on-device (Pinia + localStorage, API key via Credential
Management API). Deployed as static files; no backend.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Framework**: Vue 3.5+ with `<script setup>` Composition API
**Build Tool**: Vite 6.x (static output, no SSR)
**Primary Dependencies**:

- `vue-router` 4 — client-side routing (Home / Chat / Settings / Persona screens)
- `pinia` 2 + `pinia-plugin-persistedstate` — reactive state + localStorage sync
- `diff` (jsdiff) — character-level diff for correction dialog
- `@playwright/test` — E2E tests
- `vitest` + `@testing-library/vue` + `happy-dom` — unit/component tests

**Storage**:

- Personas, conversations, messages, settings → localStorage (via
  pinia-plugin-persistedstate)
- LLM API key → browser Credential Management API (`PasswordCredential`)
- Profile images → data URIs in localStorage (resized client-side before storage)

**Testing**:

- Unit/component: Vitest + `@testing-library/vue` + happy-dom
- E2E: Playwright against `vite preview` (production build)
- TDD: Failing tests committed before any implementation (constitution mandate)
- E2E written per user story before story implementation begins

**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge — current + 1 prior major). Mobile-first layout.

**Project Type**: Client-side SPA (web-app)

**Performance Goals**:

- Word-lookup popup: < 2 s from tap (pre-fetched; should be near-instant)
- Grammar feedback icon: ≤ 5 s from message send (network-bound)
- Initial load: < 3 s on 4G (static bundle, no server round-trip)

**Constraints**:

- No server components; all logic runs in browser
- Static build output only (no SSR, no edge functions)
- API key stored via Credential Management API; MUST NOT fall back to localStorage
- All user data stays on-device; no analytics, no telemetry

**Scale/Scope**: Single user per device; ~5 personas, ~50 conversations, ~1000 messages typical.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Pre-Design | Post-Design | Notes                                                                                                  |
| ----------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| I. Client-Only Architecture         | ✅ PASS    | ✅ PASS     | Vue SPA + Vite static build; OpenRouter via browser `fetch`; zero custom server                        |
| II. Test-First Development          | ✅ PASS    | ✅ PASS     | Vitest TDD enforced; tasks mandate failing tests before implementation                                 |
| III. E2E Tests for User Interaction | ✅ PASS    | ✅ PASS     | Playwright project covers all 5 user story happy paths + key error paths                               |
| IV. Simplicity & YAGNI              | ✅ PASS    | ✅ PASS     | Minimal stack; no speculative abstractions; jsdiff over custom LCS; Intl.Segmenter over WASM tokeniser |

No violations. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-chinese-tandem-chat/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── openrouter-chat.md
│   ├── openrouter-feedback.md
│   ├── openrouter-translation.md
│   └── openrouter-phrase-lookup.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── chat/
│   │   ├── ChatMessage.vue          # Message bubble + word segmentation
│   │   ├── ChatInput.vue            # Text input + send button
│   │   ├── FeedbackIcon.vue         # Green/red/loading/error icon
│   │   ├── CorrectionDialog.vue     # Diff dialog (red/green highlights)
│   │   ├── TranslationDialog.vue    # Green-feedback translation dialog
│   │   └── WordPopup.vue            # Pinyin + translation popup
│   ├── persona/
│   │   ├── PersonaCard.vue          # Persona list item
│   │   ├── PersonaForm.vue          # Create/edit persona form
│   │   └── PersonaPicker.vue        # Modal picker for new conversation
│   └── common/
│       └── AvatarPlaceholder.vue    # Default avatar when no image set
├── views/
│   ├── HomeView.vue                 # Conversations list
│   ├── ChatView.vue                 # Chat screen
│   ├── PersonaListView.vue          # Persona management
│   └── SettingsView.vue             # API key + context window config
├── stores/
│   ├── personas.ts                  # Pinia: persona CRUD + persistence
│   ├── conversations.ts             # Pinia: conversation + message CRUD
│   └── settings.ts                  # Pinia: context window N; API key helpers
├── services/
│   ├── openrouter.ts                # fetch wrappers for all 4 LLM call types
│   ├── credentials.ts               # Credential Management API helpers
│   ├── segmenter.ts                 # Intl.Segmenter Chinese tokenisation
│   └── diff.ts                      # jsdiff wrapper for correction diffs
├── router/
│   └── index.ts                     # Vue Router routes
├── types/
│   └── index.ts                     # Shared TypeScript interfaces
├── App.vue
└── main.ts

tests/
├── unit/
│   ├── services/
│   │   ├── segmenter.test.ts
│   │   ├── diff.test.ts
│   │   └── openrouter.test.ts       # Mock fetch; test request shape + error paths
│   └── stores/
│       ├── personas.test.ts
│       ├── conversations.test.ts
│       └── settings.test.ts
└── e2e/
    ├── us1-conversation-start.spec.ts
    ├── us2-persona-creation.spec.ts
    ├── us3-word-lookup.spec.ts
    ├── us4-phrase-lookup.spec.ts
    └── us5-message-feedback.spec.ts

e2e/ → same as tests/e2e/ (Playwright default; can symlink or configure testDir)
```

**Structure Decision**: Single Vue project at repository root. No backend directory.
Client-only SPA; all source under `src/`. Tests split into `tests/unit/` (Vitest)
and `tests/e2e/` (Playwright). The project structure maps directly to the
4 user-facing screens + the 4 LLM service call types.

## Complexity Tracking

> No violations detected — table left empty intentionally.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
