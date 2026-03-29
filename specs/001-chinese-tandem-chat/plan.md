# Implementation Plan: Chinese AI Tandem Chat

**Branch**: `001-chinese-tandem-chat` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-chinese-tandem-chat/spec.md`

## Summary

Build a client-only Chinese language tandem chat SPA using Vue 3 + Vite + TypeScript. Users create AI personas with custom system prompts, hold conversations via OpenRouter LLM API, get per-message grammar feedback with diff-based correction display, and look up Chinese words/phrases via tap and drag gestures. All data is stored client-side (localStorage via Pinia + Credential Management API for the API key). Four distinct LLM call types (chat reply, grammar feedback, word translation, phrase lookup) are orchestrated per message lifecycle.

## Technical Context

**Language/Version**: TypeScript 6.x (strict mode, no `any`)
**Framework**: Vue 3.5+ with `<script setup>` Composition API
**Build Tool**: Vite 8.x (static build output — no SSR)
**State Management**: Pinia 2 + pinia-plugin-persistedstate (localStorage)
**Routing**: Vue Router 4 (client-side)
**LLM Integration**: OpenRouter `/v1/chat/completions` (OpenAI-compatible; 4 call types)
**API Key Storage**: Browser Credential Management API → loaded once at app start into SettingsStore
**Chinese Tokenisation**: `Intl.Segmenter('zh', { granularity: 'word' })`
**Diff Library**: jsdiff `diffChars()`
**Testing**: Vitest + @testing-library/vue + happy-dom (unit); Playwright + vite preview (E2E)
**Target Platform**: Modern evergreen browsers (Chrome 87+, Firefox 108+, Safari 15.4+); mobile-first layout
**Project Type**: Client-only SPA (static files)
**Performance Goals**: Word popups < 2s (pre-fetched); feedback icons < 5s; chat responsive at 500+ messages
**Constraints**: No server-side components; all data on-device; < 10 MB localStorage budget
**Scale/Scope**: Single user; ~20 personas, ~200 conversations, ~100k messages max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Client-Only Architecture | ✅ PASS | All logic runs in browser. External API calls go to OpenRouter only. Static file deployment. |
| II. Test-First Development | ✅ PASS | TDD workflow enforced: failing test → commit → minimum impl → commit → refactor. |
| III. E2E Tests for User Interaction | ✅ PASS | E2E tests required per user story before implementation. Must pass against `vite build` output. |
| IV. Simplicity & YAGNI | ✅ PASS | Only dependencies with concrete justification: pinia-plugin-persistedstate (auto-sync), jsdiff (char diff). No unnecessary abstractions. |

### Post-Phase 1 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Client-Only Architecture | ✅ PASS | Data model is localStorage-only. API key via Credential API. No custom backend endpoints. |
| II. Test-First Development | ✅ PASS | Tasks.md enforces test-first per task. E2E tests written before story implementation. |
| III. E2E Tests for User Interaction | ✅ PASS | 5 user stories × E2E test coverage planned. Production build validation required. |
| IV. Simplicity & YAGNI | ✅ PASS | Message type hierarchy (BaseMessage → UserMessage/PersonaMessage) justified by role-specific fields. AnnotatedWord matching algorithm is purpose-built, not over-abstracted. |

## Project Structure

### Documentation (this feature)

```text
specs/001-chinese-tandem-chat/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — entity definitions
├── quickstart.md        # Phase 1 output — bootstrap guide
├── contracts/           # Phase 1 output — API call specs
│   ├── openrouter-chat.md
│   ├── openrouter-feedback.md
│   ├── openrouter-translation.md
│   └── openrouter-phrase-lookup.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
  components/
    chat/               # ChatMessage, ChatInput, FeedbackIcon, CorrectionDialog, WordPopup
    persona/            # PersonaCard, PersonaForm, PersonaPicker
    common/             # AvatarPlaceholder
  views/                # HomeView, ChatView, PersonaListView, SettingsView
  stores/               # personas.ts, conversations.ts, settings.ts
  services/             # openrouter.ts, credentials.ts, segmenter.ts, diff.ts
  router/index.ts
  types/index.ts

tests/
  unit/
    stores/             # Pinia store tests
    services/           # Service function tests
    setup.ts            # Test setup (cleanup, matchers)
  e2e/
    fixtures/           # Test data / mocks
```

**Structure Decision**: Single-project SPA structure. No backend directory. All source under `src/`, all tests under `tests/`. Components organised by domain (chat, persona, common). Services encapsulate all external interactions (OpenRouter API, Credential API, browser APIs).

## Complexity Tracking

> No constitution violations. Table empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
