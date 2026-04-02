# han-chat Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-02

## Active Technologies
- TypeScript 6.x strict mode (001-chinese-tandem-chat)
- Vue 3.5+ with `<script setup>` Composition API
- Vite 8.x (static build output — no SSR)
- Pinia 2 + pinia-plugin-persistedstate (localStorage)
- Vue Router 4 (client-side routing)
- OpenRouter `/v1/chat/completions` (OpenAI-compatible; all LLM calls)
- Browser Credential Management API (API key storage — NOT localStorage)
- Intl.Segmenter('zh', { granularity: 'word' }) (Chinese tokenisation)
- jsdiff `diffChars()` (character-level correction diff)
- Vitest + @testing-library/vue + happy-dom (unit tests)
- Playwright + vite preview (E2E tests against production build)
- TypeScript 6.x strict mode, Vue 3.5+ `<script setup>` + Vue 3.5, Vite 8.x, Pinia 2, lucide-vue-next (new), Google Fonts CDN (Noto Sans SC + Roboto) (002-ui-polish-theming)
- localStorage (Pinia persisted state for text size preference) (002-ui-polish-theming)

## Project Structure

```text
src/
  components/chat/      # ChatMessage, ChatInput, FeedbackIcon, CorrectionDialog, WordPopup
  components/persona/   # PersonaCard, PersonaForm, PersonaPicker
  components/common/    # AvatarPlaceholder
  views/                # HomeView, ChatView, PersonaListView, SettingsView
  stores/               # personas.ts, conversations.ts, settings.ts
  services/             # openrouter.ts, credentials.ts, segmenter.ts, diff.ts
  router/index.ts
  types/index.ts
tests/
  unit/                 # Vitest unit + component tests
  e2e/                  # Playwright E2E tests
```

## Commands

```bash
npm run dev             # dev server (http://localhost:5173)
npm run build           # production build → dist/
npm run preview         # serve dist/ at http://localhost:4173
npm run test:unit       # Vitest watch mode
npm run test:unit:run   # Vitest single run
npm run test:e2e        # Playwright E2E (builds first in CI)
npm run lint            # ESLint
```

## Code Style

- TypeScript strict mode; no `any`
- Vue 3 `<script setup>` only (no Options API)
- Pinia stores use `defineStore` with setup syntax preferred
- All async LLM calls via `src/services/openrouter.ts` — never call `fetch` directly from components
- API key loaded once at app start into SettingsStore via Credential Management API — never read from localStorage

## TDD Rules (Constitution Mandate)

1. Write a failing test → commit it
2. Write minimum implementation to pass → commit
3. Refactor → keep green
4. Never commit implementation without a prior failing test

E2E tests for each user story MUST be written before implementation begins.
E2E MUST pass against `vite build` output before story is complete.

## LLM Call Architecture

Per user message, 2 parallel independent calls fire:
1. Chat reply (`openrouter.chatReply`) → updates conversation with assistant message
2. Grammar feedback (`openrouter.grammarFeedback`) → updates message.feedback

After assistant message arrives, 1 sequential call fires:
3. Word translation pre-fetch (`openrouter.translateMessage`) → produces AnnotatedWord[] via matching algorithm

On phrase drag release, 1 on-demand call fires:
4. Phrase lookup (`openrouter.translatePhrase`) → shown in popup, not persisted

All calls use structured JSON output (response_format: json_schema) except chat reply.

## Recent Changes
- 002-ui-polish-theming: Added TypeScript 6.x strict mode, Vue 3.5+ `<script setup>` + Vue 3.5, Vite 8.x, Pinia 2, lucide-vue-next (new), Google Fonts CDN (Noto Sans SC + Roboto)

- 001-chinese-tandem-chat: Updated plan — native Date types, Message type hierarchy (BaseMessage/UserMessage/PersonaMessage), AnnotatedWord matching algorithm, API key loaded once at startup

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
