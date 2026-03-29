# Contract: Word-by-Word Translation Pre-fetch Call

**Type**: OpenRouter LLM API call (structured JSON output)
**Fired by**: `ChatView` immediately after an assistant message is received
**Timing**: Sequential after chat reply resolves (not parallel with chat/feedback)
**Service**: `src/services/openrouter.ts` → `translateMessage()`

---

## Purpose

Pre-fetches pinyin and English translation for every Chinese word in an assistant
message. The raw `WordTranslation[]` result is then matched to the actual message
text by the `matchTranslationsToText()` algorithm (see data-model.md) to produce
`AnnotatedWord[]`, enabling instant word-tap popups (US3) with no per-tap network call.

---

## Request

**Endpoint**: `POST https://openrouter.ai/api/v1/chat/completions`

**Headers**:
```
Authorization: Bearer <api_key>
Content-Type: application/json
```

**Body**:
```json
{
  "model": "<settings.translationModel, default 'openai/gpt-oss-120b'>",
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "word_translations",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "words": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "word":        { "type": "string" },
                "pinyin":      { "type": "string" },
                "translation": { "type": "string" }
              },
              "required": ["word", "pinyin", "translation"]
            }
          }
        },
        "required": ["words"]
      }
    }
  },
  "messages": [
    {
      "role": "system",
      "content": "You are a Chinese language translation assistant. Split the given Chinese text into individual words and provide pinyin and English translation for each word. Preserve the exact order"
    },
    {
      "role": "user",
      "content": "Please translate this Chinese text and provide pinyin and translation for each word: \"<assistant message text>\""
    }
  ]
}
```

**Key changes from prior version**:
- `startIndex` removed from schema — LLMs are unreliable at counting character positions
- Field renamed from `text` to `word` to match the `WordTranslation` interface
- System prompt updated to focus on word splitting + preserving order
- User prompt explicitly asks for per-word pinyin and translation

---

## Response (success)

```json
{
  "choices": [
    {
      "message": {
        "content": "{\"words\":[{\"word\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"translation\":\"hello\"},{\"word\":\"世界\",\"pinyin\":\"shì jiè\",\"translation\":\"world\"}]}"
      }
    }
  ]
}
```

**Parsed payload** maps to `WordTranslation[]`. This is then fed into
`matchTranslationsToText(messageContent, words)` to produce the final
`AnnotatedWord[]` stored on `PersonaMessage.renderTokens`.

---

## Post-Processing: Translation-to-Text Matching

After the LLM returns `WordTranslation[]`, the service layer runs the matching
algorithm to align translations with the actual message characters:

1. Parse LLM response → `WordTranslation[]`
2. Call `matchTranslationsToText(message.content, wordTranslations)` → `AnnotatedWord[]`
3. Store `AnnotatedWord[]` on `PersonaMessage.renderTokens`
4. Set `wordTranslationStatus: 'resolved'`

See `data-model.md` → AnnotatedWord section for the full matching algorithm.

---

## UI Behaviour While Pending

- Assistant message is displayed immediately when chat reply resolves
- Word `<span>` elements are rendered but have no tap handler yet
- A subtle shimmer/loading indicator is shown on the message
- Once this call resolves and matching completes, tap handlers are activated

---

## Error Handling

| Scenario | UI Behaviour |
|----------|-------------|
| Network error / timeout | `wordTranslationStatus: 'error'`; taps show "Translation unavailable" popup |
| JSON parse failure | Same as network error |
| HTTP 4xx / 5xx | Same as network error |

Word tap interactions degrade gracefully — the message content and chat remain fully usable.
