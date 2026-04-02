# Data Model: Chinese AI Tandem Chat

**Branch**: `001-chinese-tandem-chat` | **Date**: 2026-03-29

All entities are stored client-side in browser localStorage via Pinia stores.
The API key is stored via the Credential Management API and loaded once at app
start.

---

## Entities

### Persona

Represents an AI conversation partner profile.

```typescript
interface Persona {
  id: string                // UUID v4, generated at creation
  name: string              // Display name; >1 char, required
  systemPrompt: string      // Raw text passed verbatim to LLM system role; required
  avatarDataUri: string | null  // Resized image as data URI; null = use placeholder
  createdAt: Date           // Native JS Date
}
```

**Validation rules**:
- `name`: required, >1 characters
- `systemPrompt`: required, 1–2000 characters
- `avatarDataUri`: if provided, MUST be a `data:image/...;base64,...` string; MUST be ≤ 200 KB (enforced by client-side resize before storage)

**Lifecycle**: Created by user; no deletion in v1; edited by updating fields in place.

**Persistence note**: `createdAt` is serialised to ISO 8601 string by `pinia-plugin-persistedstate` and deserialised back to `Date` on hydration via a custom serialiser.

---

### Conversation

A chat session linking one Persona to an ordered list of Messages.

```typescript
interface Conversation {
  id: string            // UUID v4
  personaId: string     // FK → Persona.id; orphaned if persona deleted
  createdAt: Date       // Native JS Date
  updatedAt: Date       // Native JS Date; updated on each new message
  messages: Message[]   // list of messages in the conversation
}
```

**Validation rules**:
- `personaId`: MUST reference an existing Persona id at creation time; may become orphaned — displayed with "Deleted persona" placeholder

**State transitions**:
- Conversations are always resumable

---

### Message (type hierarchy)

Messages use a discriminated union based on `role`. A base type carries shared
fields; `UserMessage` and `PersonaMessage` extend it with role-specific data.

```typescript
interface BaseMessage {
  id: string                      // UUID v4
  conversationId: string          // FK → Conversation.id
  role: 'user' | 'assistant'
  content: string                 // Raw text content
  timestamp: Date                 // Native JS Date
}

interface UserMessage extends BaseMessage {
  role: 'user'
  feedback: FeedbackResult | null  // null while pending; populated when call resolves
  feedbackStatus: 'pending' | 'resolved' | 'error' | null  // null before send completes
}

interface PersonaMessage extends BaseMessage {
  role: 'assistant'
  annotatedWords: AnnotatedWord[] | null  // null while translation pending
  wordTranslationStatus: 'pending' | 'resolved' | 'error' | null
}

type Message = UserMessage | PersonaMessage
```

**Validation rules**:
- `content`: required, non-empty string
- `role`: must be `'user'` or `'assistant'`
- Type guard: `message.role === 'user'` narrows to `UserMessage`; `message.role === 'assistant'` narrows to `PersonaMessage`

**State transitions (UserMessage)**:

```
SENT
  ├── feedbackStatus: 'pending'
  │     ├── [feedback call resolves] → feedbackStatus: 'resolved', feedback: FeedbackResult
  │     └── [feedback call fails]    → feedbackStatus: 'error', feedback: null
```

**State transitions (PersonaMessage)**:

```
RECEIVED
  ├── wordTranslationStatus: 'pending'
  │     ├── [translation call resolves] → wordTranslationStatus: 'resolved', annotatedWords: AnnotatedWord[]
  │     └── [translation call fails]    → wordTranslationStatus: 'error', annotatedWords: null
```

---

### FeedbackResult

Grammar feedback for a user-sent message. Embedded in `UserMessage.feedback`.

```typescript
interface FeedbackResult {
  isCorrect: boolean            // true = green icon, false = red icon
  translation: string           // English translation of the user's original message
  corrected: string             // empty string when isCorrect is true; corrected message otherwise
}
```

**Notes**:
- `translation` is always populated (used by both green and red feedback dialog)
- `corrected` is empty `""` for correct messages; non-empty for errors
- The character-level diff shown in the UI is computed from `corrected` and original message text by the `diff` service at render time — not stored directly

---

### WordTranslation

Raw translation result returned by the LLM for a single Chinese word.
This is the intermediate format before matching to the actual message text.

```typescript
interface WordTranslation {
  word: string          // The Chinese word as identified by the LLM
  pinyin: string        // Tone-marked pinyin (e.g., "nǐ hǎo")
  translation: string   // English translation of the word in context
}
```

**Notes**:
- No `startIndex` field — LLMs are unreliable at counting character positions
- The `word` field from the LLM is matched to the actual message text using the AnnotatedWord algorithm (see below)

---

### AnnotatedWord

The final per-character/word unit used to render assistant messages with
inline translation popups. Produced by the matching algorithm that aligns
LLM-returned `WordTranslation[]` to the actual message text.

```typescript
interface AnnotatedWord {
  word: string              // The text segment (Chinese word, punctuation, or single char)
  pinyin: string | null    // Pinyin if translated; null if punctuation/unmatched
  translation: string | null  // English translation if translated; null if punctuation/unmatched
}
```

**Matching algorithm** (run client-side after translation call resolves):

```typescript
function matchTranslationsToText(
  text: string,
  tokens: WordTranslation[]
): AnnotatedWord[] {
  const queue = [...tokens]  // mutable copy
  const annotatedWords: AnnotatedWord[] = []

  for (let i = 0; i < text.length; ) {
    const firstWord = queue.at(0)?.word
    const firstLength = firstWord ? firstWord.length : 1
    const firstCandidate = text.substring(i, i + firstLength)

    const secondWord = queue.at(1)?.word
    const secondLength = secondWord ? secondWord.length : 1
    const secondCandidate = text.substring(i, i + secondLength)

    if (isPunctuation(firstCandidate)) {
      // Punctuation: skip in translation queue if it matches
      if (firstWord === firstCandidate) {
        queue.shift()
      } else if (firstWord && firstWord.startsWith(firstCandidate)) {
        queue[0] = { ...queue[0], word: firstWord.replace(firstCandidate, '') }
      }
      annotatedWords.push({ word: firstCandidate, pinyin: false, translation: false })
      i += 1
    } else if (firstCandidate === firstWord) {
      // Exact match with first queued translation
      const token = queue.shift()!
      annotatedWords.push({
        word: token.word,
        pinyin: token.pinyin,
        translation: token.translation,
      })
      i += firstCandidate.length
    } else if (secondCandidate === secondWord) {
      // Skip a mismatched first token; match second (handles LLM double-words)
      queue.shift()
      const token = queue.shift()!
      annotatedWords.push({
        word: token.word,
        pinyin: token.pinyin,
        translation: token.translation,
      })
      i += secondCandidate.length
    } else {
      // Unmatched character: render without translation
      annotatedWords.push({ word: text[i], pinyin: false, translation: false })
      i += 1
    }
  }

  return annotatedWords
}
```

**`isPunctuation` helper**: Returns true for CJK punctuation and standard ASCII punctuation characters (spaces, commas, periods, etc.).

---

### AppSettings

Device-level configuration. Not tied to any user identity.

```typescript
interface AppSettings {
  contextWindowSize: number  // Default: 8; range: 1–50; user-configurable
  chatModel: string          // Default: 'deepseek/deepseek-v3.2'
  feedbackModel: string      // Default: 'deepseek/deepseek-v3.2'
  translationModel: string   // Default: 'google/gemini-2.5-flash-lite'
  phraseLookupModel: string  // Default: 'google/gemini-2.5-flash-lite'
  apiKey: string | null       // Loaded once at app start from Credential Management API
}
```

**Persistence**:
- `contextWindowSize` and all model strings → localStorage via `settings` Pinia store
- `apiKey` → **NOT persisted to localStorage**. Loaded once at app startup from Credential Management API into the store's reactive state. Written back to Credential Management API when changed in Settings.

**API key loading flow**:
1. App mounts → `settings` store `init()` action fires
2. `init()` calls `navigator.credentials.get({ password: true, mediation: 'silent' })`
3. If credential found → `apiKey` set in store state (reactive, in-memory only)
4. If not found → `apiKey` remains `null`; user is redirected to Settings on first LLM call attempt, and a toast message from the bottom is shown indicating what he needs to do. 
5. All services read `apiKey` from the `settings` store — never call Credential API directly

---

## Relationships

```
Persona 1──* Conversation
Conversation 1──* Message (UserMessage | PersonaMessage)
UserMessage 0..1──1 FeedbackResult
PersonaMessage 0..*──1 AnnotatedWord[]  (matched from WordTranslation[])
```

---

## Storage Keys (localStorage)

| Key | Contents |
|-----|----------|
| `han-chat-personas` | Serialised `Persona[]` |
| `han-chat-conversations` | Serialised `Conversation[]` (each embedding `Message[]`) |
| `han-chat-settings` | Serialised `AppSettings` (excluding `apiKey`) |

**Date serialisation**: All `Date` fields are serialised to ISO 8601 strings by
`pinia-plugin-persistedstate` and deserialised back to `Date` objects on store
hydration. This is handled by a custom `serializer` option on each store:

```typescript
{
  persist: {
    serializer: {
      serialize: JSON.stringify,
      deserialize: (value: string) => {
        return JSON.parse(value, (key, val) => {
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
            return new Date(val)
          }
          return val
        })
      }
    }
  }
}
```

**Note**: `apiKey` is excluded from localStorage persistence via the `paths` option on the settings store.

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
