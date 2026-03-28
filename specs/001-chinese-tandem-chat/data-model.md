# Data Model: Chinese AI Tandem Chat

**Branch**: `001-chinese-tandem-chat` | **Date**: 2026-03-28

All entities are stored client-side in browser localStorage via Pinia stores.
The API key is stored separately via the Credential Management API.

---

## Entities

### Persona

Represents an AI conversation partner profile.

```typescript
interface Persona {
  id: string                // UUID v4, generated at creation
  name: string              // Display name; 1–50 chars, required
  systemPrompt: string      // Raw text passed verbatim to LLM system role; required
  avatarDataUri: string | null  // Resized image as data URI; null = use placeholder
  createdAt: string         // ISO 8601 datetime
}
```

**Validation rules**:
- `name`: required, 1–50 characters
- `systemPrompt`: required, 1–2000 characters
- `avatarDataUri`: if provided, MUST be a `data:image/...;base64,...` string; MUST be ≤ 200 KB (enforced by client-side resize before storage)

**Lifecycle**: Created by user; no deletion in v1; edited by updating fields in place.

---

### Conversation

A named chat session linking one Persona to an ordered list of Messages.

```typescript
interface Conversation {
  id: string            // UUID v4
  personaId: string     // FK → Persona.id; set to null if persona deleted (orphaned)
  createdAt: string     // ISO 8601 datetime
  updatedAt: string     // ISO 8601; updated on each new message
}
```

**Validation rules**:
- `personaId`: MUST reference an existing Persona id at creation time; may become orphaned (persona was deleted) — displayed with "Deleted persona" placeholder

**State transitions**:
- `active` → ongoing while user is chatting (transient UI state, not persisted)
- Conversations have no explicit status field; they are always open/resumable

---

### Message

A single turn in a Conversation.

```typescript
interface Message {
  id: string                      // UUID v4
  conversationId: string          // FK → Conversation.id
  role: 'user' | 'assistant'
  content: string                 // Raw text content
  timestamp: string               // ISO 8601 datetime
  // Only present on role === 'user' messages:
  feedback: FeedbackResult | null  // null while pending; populated when call resolves
  feedbackStatus: 'pending' | 'resolved' | 'error' | null  // null for assistant messages
  // Only present on role === 'assistant' messages:
  wordTranslations: WordTranslation[] | null  // null while pre-fetch pending
  wordTranslationStatus: 'pending' | 'resolved' | 'error' | null  // null for user messages
}
```

**Validation rules**:
- `content`: required, non-empty string
- `role`: must be `'user'` or `'assistant'`
- `feedback` and `feedbackStatus` are mutually exclusive with `wordTranslations` / `wordTranslationStatus` per role

**State transitions (user message)**:

```
SENT
  ├── feedbackStatus: 'pending'
  │     ├── [feedback call resolves] → feedbackStatus: 'resolved', feedback: FeedbackResult
  │     └── [feedback call fails]    → feedbackStatus: 'error', feedback: null
```

**State transitions (assistant message)**:

```
RECEIVED
  ├── wordTranslationStatus: 'pending'
  │     ├── [translation call resolves] → wordTranslationStatus: 'resolved', wordTranslations: [...]
  │     └── [translation call fails]    → wordTranslationStatus: 'error', wordTranslations: null
```

---

### FeedbackResult

Grammar feedback for a user-sent message. Embedded in `Message.feedback`.

```typescript
interface FeedbackResult {
  isCorrect: boolean            // true = green icon, false = red icon
  translation: string           // English translation of the user's original message
  corrections: Correction[]     // Empty array when isCorrect === true
}

interface Correction {
  original: string    // The wrong segment (may be empty string for pure insertions)
  corrected: string   // The correct replacement (may be empty string for pure deletions)
  position: number    // Character offset in the original message (for ordering)
}
```

**Notes**:
- `translation` is always populated (used by both green and red feedback dialog)
- `corrections` is empty `[]` for correct messages; non-empty for errors
- The character-level diff shown in the UI is computed from `corrections` by the `diff` service at render time — not stored directly

---

### WordTranslation

Per-word pinyin and translation for a single Chinese word in an assistant message.
Stored as an array embedded in `Message.wordTranslations`.

```typescript
interface WordTranslation {
  text: string        // The original Chinese word/segment (as segmented by Intl.Segmenter)
  pinyin: string      // Space-separated pinyin with tone marks (e.g., "nǐ hǎo")
  translation: string // English translation of the word in context
  startIndex: number  // Character offset in Message.content (for tap-target mapping)
  endIndex: number    // Exclusive end offset
}
```

**Notes**:
- Only Chinese-script segments are included; punctuation and spaces are omitted
- `startIndex`/`endIndex` allow the UI to map a tapped `<span>` back to its translation without re-running the LLM call

---

### AppSettings

Device-level configuration. Not tied to any user identity.

```typescript
interface AppSettings {
  contextWindowSize: number  // Default: 8; range: 1–50; user-configurable
  // Note: API key is NOT stored here — it lives in the Credential Management API
}
```

**Persistence**: `contextWindowSize` → localStorage via `settings` Pinia store.
**API key**: Retrieved at runtime via `navigator.credentials.get()`; never stored in AppSettings.

---

## Relationships

```
Persona 1──* Conversation
Conversation 1──* Message
Message 0..1──1 FeedbackResult    (user messages only)
Message 0..*──1 WordTranslation[] (assistant messages only)
```

---

## Storage Keys (localStorage)

| Key | Contents |
|-----|----------|
| `han-chat-personas` | Serialised `Persona[]` |
| `han-chat-conversations` | Serialised `Conversation[]` |
| `han-chat-messages` | Serialised `Message[]` (all conversations) |
| `han-chat-settings` | Serialised `AppSettings` |

**Note**: The `conversations` store includes messages to keep related data colocated.
If message volume grows, messages can be split to a separate key per conversation id.

---

## Identity & Uniqueness Rules

- All entity `id` fields are UUIDs (v4); generated client-side with `crypto.randomUUID()`
- `Persona.name` is not required to be unique (two personas may share a name)
- `Conversation` uniqueness is by `id`; multiple conversations may reference the same `personaId`
- `Message.timestamp` is used for ordering within a conversation; collisions are resolved by insertion order

---

## Data Volume Estimates

| Entity | Typical | Max (v1) |
|--------|---------|----------|
| Personas | 3–5 | 20 |
| Conversations | 10–50 | 200 |
| Messages per conversation | 20–100 | 500 |
| Total messages | 200–5000 | 100,000 |
| Total localStorage usage | ~0.5–2 MB | ~10 MB |

Profile images (avatarDataUri) are the main storage risk; each MUST be resized to
< 200 KB before storage. With 20 personas × 200 KB = 4 MB maximum from images alone.
