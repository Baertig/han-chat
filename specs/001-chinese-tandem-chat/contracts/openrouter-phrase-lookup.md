# Contract: Phrase Lookup Call

**Type**: OpenRouter LLM API call (structured JSON output)
**Fired by**: `ChatMessage` component on press-and-drag release (US4)
**Timing**: On-demand; fired when user releases drag gesture
**Service**: `src/services/openrouter.ts` → `translatePhrase()`

---

## Purpose

Translates a user-selected multi-word phrase (from drag gesture) into pinyin and
English. Unlike word-by-word translation (which is pre-fetched), phrase translation
is fired on demand because the specific phrase is not known in advance.

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
      "name": "phrase_lookup",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "phrase":      { "type": "string" },
          "pinyin":      { "type": "string" },
          "translation": { "type": "string" }
        },
        "required": ["phrase", "pinyin", "translation"]
      }
    }
  },
  "messages": [
    {
      "role": "system",
      "content": "You are a Chinese language dictionary. Given a Chinese phrase or word, return its pinyin (with tone marks) and English translation. Ignore any punctuation in the input. Return JSON only."
    },
    {
      "role": "user",
      "content": "<selected Chinese text from drag gesture>"
    }
  ]
}
```

**Input**: The selected text is extracted from the drag gesture range. Punctuation
characters are stripped client-side before sending (per spec US4 acceptance scenario 2).

---

## Response (success)

```json
{
  "choices": [
    {
      "message": {
        "content": "{\"phrase\":\"学习汉语\",\"pinyin\":\"xuéxí hànyǔ\",\"translation\":\"to study Chinese\"}"
      }
    }
  ]
}
```

**Consumed fields**: `phrase`, `pinyin`, `translation` — displayed directly in the
phrase popup. Not persisted to message state.

---

## UI Behaviour

- Popup opens immediately on drag release with a loading spinner
- Once call resolves: spinner replaced by pinyin + translation
- Dismissing popup (tap outside) cancels any in-flight call if still pending

---

## Error Handling

| Scenario | UI Behaviour |
|----------|-------------|
| Network error / timeout | Popup shows "Translation unavailable. Try again." |
| JSON parse failure | Same as network error |
| HTTP 4xx / 5xx | Same as network error |
| Empty selection / only punctuation | Call not fired; popup does not open |
