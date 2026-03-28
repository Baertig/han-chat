# Research: Chinese AI Tandem Chat

**Branch**: `001-chinese-tandem-chat` | **Date**: 2026-03-28

All unknowns from Technical Context resolved. No NEEDS CLARIFICATION items remain.

---

## 1. Vue 3 + Vite Project Scaffold

**Decision**: `create-vue` (official scaffolding) with TypeScript + `<script setup>` + Pinia + Vue Router selected at init time.

**Rationale**: The canonical 2025/2026 approach. Vite-based; zero additional config required for TypeScript and `<script setup>`. Interactive init prompts include Pinia, Vue Router, Vitest, ESLint, and Playwright, covering all project needs in one scaffold command.

**Alternatives considered**:
- Nuxt 3 — overkill; adds SSR/file-based routing overhead not needed for a client-only SPA
- Manual Webpack — deprecated; Vite is faster and simpler
- Vue 2 — EOL September 2024; Vue 3 Composition API is the correct choice

**Key config**:
```
npm create vue@latest han-chat
# Select: TypeScript ✓, Vue Router ✓, Pinia ✓, Vitest ✓, Playwright ✓, ESLint ✓
```

---

## 2. State & Persistence: Pinia + pinia-plugin-persistedstate

**Decision**: Pinia stores for all runtime state; `pinia-plugin-persistedstate` for automatic localStorage sync. Manual IndexedDB is deferred unless localStorage quota is hit (> ~5 MB).

**Rationale**: `pinia-plugin-persistedstate` is Pinia-endorsed and handles serialisation/deserialisation automatically. The expected data volume (≤ 50 conversations × ~100 messages × ~200 bytes/message ≈ 1 MB) fits comfortably within localStorage limits. Selective `paths` config excludes transient UI state.

**Alternatives considered**:
- Manual `localStorage` in actions — boilerplate-heavy, no batching
- IndexedDB from the start — async complexity not justified for v1 data scale
- sessionStorage — data lost on tab close; unsuitable

**Storage layout**:
- `personas` store → persisted (key: `han-chat-personas`)
- `conversations` store → persisted (key: `han-chat-conversations`)
- `settings` store → persisted excluding API key (key: `han-chat-settings`)
- API key → **Credential Management API only** (never localStorage)

---

## 3. LLM Integration: OpenRouter

**Decision**: OpenRouter `/api/v1/chat/completions` (OpenAI-compatible). Two parallel `fetch` calls per user message (chat reply + grammar feedback). One additional `fetch` call immediately after the AI reply arrives (word-by-word translation). One `fetch` call on phrase drag (phrase lookup).

**Rationale**: OpenRouter normalises multiple LLM providers to the OpenAI schema. `response_format: { type: "json_schema", json_schema: {...} }` ensures structured output for feedback and translation payloads. Parallel calls via independent `fetch` promises (not `Promise.all`) so each result updates the UI independently as it resolves.

**Alternatives considered**:
- Direct OpenAI API — single provider; OpenRouter provides model flexibility
- LangChain/LlamaIndex — unnecessary abstraction overhead for simple fetch calls
- Custom backend relay — violates client-only constitution principle

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
**Auth header**: `Authorization: Bearer <key>`
**Model param**: user-selectable model string (e.g., `anthropic/claude-3.5-sonnet`)

**Four distinct call types** (see contracts/ for full schemas):
1. **Chat reply** — conversational response using persona system prompt + last N messages
2. **Grammar feedback** — structured JSON: `{ is_correct, translation, corrections[] }`
3. **Word-by-word translation** — structured JSON: `{ words: [{ text, pinyin, translation }] }` — fired once per AI message on arrival
4. **Phrase lookup** — structured JSON: `{ phrase, pinyin, translation }` — fired on drag-select release

**Parallel call pattern**:
```typescript
// Chat reply and grammar feedback fire simultaneously; each resolves independently
const chatPromise = openrouter.chatReply(messages, systemPrompt)
const feedbackPromise = openrouter.grammarFeedback(userMessage)

// UI updates as each resolves — do NOT use Promise.all (would couple the two)
chatPromise.then(reply => store.appendAssistantMessage(reply))
feedbackPromise.then(fb => store.setMessageFeedback(messageId, fb))
```

---

## 4. API Key Storage: Credential Management API

**Decision**: `navigator.credentials` (`PasswordCredential`) for store/retrieve. No fallback to localStorage. If API unavailable, inform user and block LLM calls.

**Rationale**: Only browser-native method that integrates with the OS password manager and keeps the key out of plaintext storage. Required by FR-014 and the constitution's privacy principle.

**Browser support**: Chrome 51+, Firefox 60+, Safari 12+ — full support on all target browsers.

**Pattern**:
```typescript
// Store
const cred = new PasswordCredential({ id: 'han-chat-openrouter', password: apiKey, name: 'OpenRouter API Key' })
await navigator.credentials.store(cred)

// Retrieve
const cred = await navigator.credentials.get({ password: true, mediation: 'silent' })
const apiKey = (cred as PasswordCredential)?.password ?? null
```

**Fallback**: If `window.PasswordCredential` is undefined, display a persistent banner:
> "Secure credential storage is not available in your browser. API key cannot be stored."
Do NOT fall back to localStorage silently (FR-014).

---

## 5. Chinese Text Tokenisation: Intl.Segmenter

**Decision**: `Intl.Segmenter('zh', { granularity: 'word' })` as primary method. Character-by-character split as fallback for older browsers.

**Rationale**: Native browser API; uses ICU dictionary-based word segmentation recognising multi-character words (e.g., `学习`, `中国人`). No npm dependency, no WASM bundle overhead. Supported in Chrome 87+, Firefox 108+, Safari 15.4+ — covers all target browsers.

**Alternatives considered**:
- nodejieba (WASM) — accurate but adds ~500 KB bundle; overkill for this use case
- chinese-tokenizer (npm) — requires bundled CC-CEDICT dictionary (~3 MB)
- Character-by-character — simplest fallback; produces suboptimal UX for multi-char words

**Usage**: Segment each AI message on render; cache result in component state. For phrase drag, re-segment the selected substring on release.

---

## 6. Character-Level Diff: jsdiff

**Decision**: `diffChars()` from the `diff` npm package (jsdiff).

**Rationale**: Myers O(ND) LCS algorithm; works correctly with Chinese characters without special handling. Returns `Array<{ value, added?, removed? }>` trivially mapped to red/green `<span>` elements. 40M+ weekly downloads; battle-tested.

**Alternatives considered**:
- fast-diff — slightly faster in benchmarks but less mature ecosystem
- Custom LCS — unnecessary boilerplate when jsdiff exists
- Line-level diff — wrong granularity for single-sentence corrections

**Render pattern**: Compute diff lazily when correction dialog opens; cache result.

---

## 7. Unit Testing: Vitest + @testing-library/vue + happy-dom

**Decision**: Vitest with happy-dom environment; `@testing-library/vue` for user-centric component tests; `@vue/test-utils` for mounting.

**Rationale**: happy-dom is 2-3× faster than jsdom and covers ~90% of DOM APIs needed. `@testing-library/vue` queries by role/text reduce brittle selector coupling. Vitest is the standard for Vue 3 / Vite projects.

**Fallback**: Switch individual test files to `jsdom` environment via `@vitest-environment jsdom` comment if `window.matchMedia` or full CSSOM is needed.

---

## 8. E2E Testing: Playwright

**Decision**: Playwright with `webServer` pointing to `vite preview` (production build) in CI; `vite dev` locally. Mobile device profiles: iPhone 12 + Desktop Chrome minimum.

**Rationale**: Playwright has the best built-in mobile device simulation library. Running E2E against the production bundle (not dev server) catches Vite build-specific issues. `reuseExistingServer` keeps local iteration fast.

**Projects configured**:
- `Desktop Chrome` (1280×720)
- `iPhone 12` (390×844, touch, mobile UA)
- `iPad Pro 11` (834×1119, touch)

**Gotchas**:
- Use `page.tap()` for touch interactions in mobile E2E tests
- Credential Management API calls should be mocked in E2E (HTTPS required; localhost OK)
- `Promise.allSettled`-based parallel calls require Playwright `waitForResponse` pattern

---

## Resolution Summary

| Unknown | Resolved As |
|---------|-------------|
| Framework | Vue 3 + Vite + TypeScript |
| State management | Pinia + pinia-plugin-persistedstate |
| LLM provider | OpenRouter `/v1/chat/completions` |
| API key storage | Credential Management API (`PasswordCredential`) |
| Chinese tokenisation | `Intl.Segmenter('zh', { granularity: 'word' })` |
| Diff algorithm | jsdiff `diffChars()` |
| Unit test stack | Vitest + @testing-library/vue + happy-dom |
| E2E test stack | Playwright + vite preview |
| Word translation source | LLM structured JSON (pre-fetched on AI message arrival) |
| Phrase translation source | LLM structured JSON (on-demand on drag release) |
