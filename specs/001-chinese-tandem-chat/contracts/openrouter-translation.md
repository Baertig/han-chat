# Contract: Word-by-Word Translation Pre-fetch Call

**Type**: OpenRouter LLM API call (structured JSON output)
**Fired by**: `ChatView` immediately after an assistant message is received
**Timing**: Sequential after chat reply resolves (not parallel with chat/feedback)
**Service**: `src/services/openrouter.ts` → `translateMessage()`

---

## Purpose

Pre-fetches pinyin and English translation for every Chinese word in an assistant
message so that word-tap popups (US3) are instant (no per-tap network call).

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
  "model": "<user-selected model string>",
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
                "text":        { "type": "string" },
                "pinyin":      { "type": "string" },
                "translation": { "type": "string" },
                "startIndex":  { "type": "integer" }
              },
              "required": ["text", "pinyin", "translation", "startIndex"]
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
      "content": "You are a Chinese language dictionary. For each Chinese word in the given text, return its pinyin (with tone marks) and English translation. Return JSON only. Include the start character index into the original text."
    },
    {
      "role": "user",
      "content": "<assistant message text>"
    }
  ]
}
```

---

## Response (success)

```json
{
  "choices": [
    {
      "message": {
        "content": "{\"words\":[{\"text\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"translation\":\"hello\",\"startIndex\":0},{\"text\":\"世界\",\"pinyin\":\"shì jiè\",\"translation\":\"world\",\"startIndex\":2}]}"
      }
    }
  ]
}
```

**Parsed payload** maps to `WordTranslation[]` stored on `Message.wordTranslations`.

---

## UI Behaviour While Pending

- Assistant message is displayed immediately when chat reply resolves
- Word `<span>` elements are rendered but have no tap handler yet
- A subtle shimmer/loading indicator is shown on the message
- Once this call resolves, tap handlers are activated

---

## Error Handling

| Scenario | UI Behaviour |
|----------|-------------|
| Network error / timeout | `wordTranslationStatus: 'error'`; taps show "Translation unavailable" popup |
| JSON parse failure | Same as network error |
| HTTP 4xx / 5xx | Same as network error |

Word tap interactions degrade gracefully — the message content and chat remain fully usable.
