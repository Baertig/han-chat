# Contract: Chat Reply Call

**Type**: OpenRouter LLM API call
**Fired by**: `ChatView` on user message send
**Parallel with**: Grammar Feedback call (see `openrouter-feedback.md`)
**Service**: `src/services/openrouter.ts` → `chatReply()`

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
  "model": "<user-selected model string, e.g. anthropic/claude-3.5-sonnet>",
  "messages": [
    { "role": "system", "content": "<persona.systemPrompt>" },
    { "role": "user",      "content": "<message N-7 content>" },
    { "role": "assistant", "content": "<message N-6 content>" },
    "...",
    { "role": "user",      "content": "<latest user message>" }
  ]
}
```

**Context window**: Last N messages (default N=8, user-configurable). The system
message is always included and does NOT count toward N.

---

## Response (success)

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "<AI persona reply text>"
      }
    }
  ]
}
```

**Consumed field**: `choices[0].message.content` → stored as new `Message` with
`role: 'assistant'`, triggering the word-translation pre-fetch call.

---

## Error Handling

| Scenario | UI Behaviour |
|----------|-------------|
| Network error / timeout | Inline retry error shown on message bubble |
| HTTP 4xx (bad API key, quota) | Error state on bubble; user prompted to check settings |
| HTTP 5xx (provider error) | Error state on bubble; retry button shown |
| Empty `choices` array | Treat as error; show retry |

Failure here does NOT affect the grammar feedback call (independent).
