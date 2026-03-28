# Contract: Grammar Feedback Call

**Type**: OpenRouter LLM API call (structured JSON output)
**Fired by**: `ChatView` on user message send
**Parallel with**: Chat Reply call (see `openrouter-chat.md`)
**Service**: `src/services/openrouter.ts` → `grammarFeedback()`

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
      "name": "grammar_feedback",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "is_correct": { "type": "boolean" },
          "translation": { "type": "string" },
          "corrections": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "original":  { "type": "string" },
                "corrected": { "type": "string" },
                "position":  { "type": "integer" }
              },
              "required": ["original", "corrected", "position"]
            }
          }
        },
        "required": ["is_correct", "translation", "corrections"]
      }
    }
  },
  "messages": [
    {
      "role": "system",
      "content": "You are a Chinese language teacher. Analyse the user's Chinese message for grammar and vocabulary errors. Return JSON only."
    },
    {
      "role": "user",
      "content": "<user's message text>"
    }
  ]
}
```

**Note**: This call uses a fixed system prompt (grammar teacher role), NOT the
persona's system prompt. It receives only the single user message — no conversation
history — to keep the feedback focused and cost-efficient.

---

## Response (success)

```json
{
  "choices": [
    {
      "message": {
        "content": "{\"is_correct\":true,\"translation\":\"I am very happy.\",\"corrections\":[]}"
      }
    }
  ]
}
```

**Parsed payload** (`JSON.parse(choices[0].message.content)`):

```typescript
{
  is_correct: boolean          // true → green icon; false → red icon
  translation: string          // English translation of the user's original message
  corrections: Array<{
    original: string            // Wrong/missing segment (empty string = pure insertion)
    corrected: string           // Correct replacement (empty string = pure deletion)
    position: number            // Character offset in original message
  }>
}
```

**Mapping to `FeedbackResult`**: direct 1:1 (camelCase normalisation applied in service layer).

---

## Error Handling

| Scenario | UI Behaviour |
|----------|-------------|
| Network error / timeout | Feedback icon shows error state (grey ⚠); chat reply unaffected |
| JSON parse failure | Treat as error; show error icon |
| HTTP 4xx / 5xx | Error icon; no retry (user can re-send message if needed) |
| `is_correct` missing from payload | Treat as error |

Failure here does NOT affect the chat reply call (independent).
