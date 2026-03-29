# Feature Specification: Chinese AI Tandem Chat

**Feature Branch**: `001-chinese-tandem-chat`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "The goal of this app is to provide chinese language learners with an AI powered tandem partner..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Persona Selection and Conversation Start (Priority: P1)

A learner opens the app and sees a home screen listing all their past conversations.
From here they can resume a conversation, pick an existing persona to start a new conversation, or tap a
button to create a brand-new persona. Once a persona is chosen, the chat screen opens
and they can begin exchanging messages.

**Why this priority**: This is the entry point of the entire app. Without the ability
to select a persona and start a conversation, no other feature is reachable. It
establishes the core navigation skeleton and is the minimum viable product slice.

**Independent Test**: Open the app with no existing data, create a persona, start a
conversation, send one message, and receive a reply — the full happy path can be
demonstrated with no other features enabled.

**Acceptance Scenarios**:

1. **Given** the app is opened for the first time, **When** the home screen loads,
   **Then** an empty conversations list is shown together with a "New conversation"
   button and a "New persona" button.
2. **Given** at least one persona exists, **When** the user taps "New conversation",
   **Then** a persona picker is presented listing all available personas.
3. **Given** a persona is selected, **When** the user confirms, **Then** a new chat
   screen opens with the chosen persona's name and avatar visible.
4. **Given** the chat screen is open, **When** the user types a message and sends it,
   **Then** the message appears in the chat and a reply from the AI persona is
   received and displayed.
5. **Given** past conversations exist, **When** the home screen loads, **Then** all
   previous conversations are listed with the persona name, last message preview, and
   timestamp.
6. **Given** the conversations list, **When** the user taps an existing conversation,
   **Then** the full chat history is restored and they can continue chatting.

---

### User Story 2 - Persona Creation and Management (Priority: P2)

A learner wants to tailor their practice partner. They tap "New persona", give it a
name, optionally upload a profile image, and write a system prompt that defines the
persona's personality, speaking style, and difficulty level. The persona is saved and
immediately available for starting conversations.

**Why this priority**: The persona is the foundation of every conversation, but the
app can ship with one default persona first (P1), making this independently valuable
as the customisation layer.

**Independent Test**: From an empty state, create a persona with a name, profile
image, and system prompt; verify it appears in the persona list; start a conversation
with it and confirm the AI behaviour reflects the system prompt.

**Acceptance Scenarios**:

1. **Given** the user taps "New persona", **When** the persona creation form opens,
   **Then** fields for name, profile image, and system prompt are shown.
2. **Given** the persona form is filled with a name and system prompt, **When** the
   user saves, **Then** the persona is persisted locally and appears in the persona
   list.
3. **Given** the user taps the profile image field, **When** they select an image
   from their device, **Then** a cropped/resized preview is shown and saved with the
   persona.
4. **Given** a persona exists, **When** a conversation is started with it, **Then**
   the system prompt defined on the persona is used as the LLM context for that
   conversation.
5. **Given** a persona without a profile image, **When** it is displayed anywhere in
   the app, **Then** a generated or default avatar placeholder is shown.

---

### User Story 3 - Single-Word Lookup (Priority: P3)

During a chat the learner encounters a Chinese word they don't know. They tap the
word and a popup appears showing the word's pinyin (romanisation) and its English
translation. Dismissing the popup returns focus to the chat.

**Why this priority**: This is the first language-learning aid that distinguishes this
app from a generic chat. It is independently useful on any conversation.

**Independent Test**: Open any conversation containing Chinese text, tap a single
character or word, verify that pinyin and translation appear in a popup above or near
the tapped word.

**Acceptance Scenarios**:

1. **Given** a chat message contains Chinese text, **When** the user taps a single
   word or character, **Then** a popup shows the pinyin and English translation of
   that word.
2. **Given** the word popup is open, **When** the user taps outside the popup or
   dismisses it, **Then** the popup closes and no other state changes.
3. **Given** a tapped word has no translation available (e.g., proper noun, number),
   **When** the lookup is attempted, **Then** the popup shows a "No translation found"
   message rather than failing silently.
4. **Given** an AI-sent message, **When** any Chinese word in it is tapped, **Then**
   the word lookup works. User-sent messages are not tappable for lookup.

---

### User Story 4 - Multi-Word Phrase Lookup (Priority: P4)

The learner wants to understand a multi-word phrase. They press and drag across a
span of Chinese text; upon releasing, a popup shows the combined pinyin and
translation for the selected phrase.

**Why this priority**: Extends single-word lookup to phrases, which is important for
idiomatic Chinese. Depends on the word-tap interaction pattern established in US3.

**Independent Test**: In a conversation with Chinese text, perform a press-and-drag
gesture over two or more words and verify a single popup appears with the combined
phrase's pinyin and translation.

**Acceptance Scenarios**:

1. **Given** a chat message with Chinese text, **When** the user presses and drags
   over multiple words and releases, **Then** a popup shows the pinyin and translation
   for the entire selected phrase.
2. **Given** the phrase selection crosses a sentence boundary (punctuation included),
   **When** the lookup is shown, **Then** only the Chinese characters/words are
   included in the lookup (punctuation is ignored).
3. **Given** the popup is open after a drag selection, **When** the user taps outside
   it, **Then** the popup and the text selection both dismiss.

---

### User Story 5 - Message Feedback (Grammar and Correction) (Priority: P5)

After the learner sends a Chinese message, a feedback icon appears on their sent
message bubble. A green icon means the message was correct; a red icon means there
are errors. Tapping the icon in either state opens a dialog with detailed feedback.

**Why this priority**: This is the most complex feature and requires AI processing
per message. It builds on the established chat infrastructure and is a powerful but
separable enhancement.

**Independent Test**: Send a grammatically correct Chinese message and verify a green
icon appears; send a message with a deliberate error and verify a red icon appears
with a diff dialog showing the correction.

**Acceptance Scenarios**:

1. **Given** the user sends a Chinese message, **When** the AI feedback is received,
   **Then** a feedback icon is displayed on the sent message bubble — green if
   correct, red if errors are present.
2. **Given** a green feedback icon on a sent message, **When** the user taps it,
   **Then** a dialog opens showing the English translation of the user's original
   message.
3. **Given** a red feedback icon on a sent message, **When** the user taps it,
   **Then** a dialog opens showing the user's original (wrong) message on top and
   the corrected message on the bottom, with wrong/replaced characters highlighted
   in red and added/missing characters highlighted in green.
4. **Given** the feedback dialog is open, **When** the user dismisses it, **Then**
   the dialog closes and the chat is unmodified.
5. **Given** feedback is still being processed after a message is sent, **When** the
   result has not yet arrived, **Then** a neutral loading indicator is shown on the
   message bubble until the result arrives.

---

### Edge Cases

- What happens when the AI endpoint is unreachable? The app MUST show an inline error
  on the message bubble and allow the user to retry; it MUST NOT crash or show a blank
  screen.
- What happens when one of the two parallel calls fails but the other succeeds? Each
  call fails independently: if the chat reply fails the bubble shows a retry error; if
  the feedback call fails the icon shows an error state (distinct from green/red)
  without affecting the displayed reply.
- What happens when a user sends a non-Chinese message (e.g., English or emoji)?
  Feedback and word-lookup features gracefully indicate they are not applicable
  rather than returning errors.
- What happens when a conversation grows very long? The chat view MUST remain
  scrollable and responsive without degrading as message count increases.
- What happens when the user's device storage is nearly full and a new message cannot
  be persisted? The user is notified and the message send is aborted cleanly.
- What happens when a persona is deleted that has existing conversations? Existing
  conversations are retained but displayed with a "Deleted persona" placeholder.
- What happens when no API key has been stored yet and the user tries to send a
  message? The app MUST redirect the user to the settings screen with an explanatory
  message before attempting any LLM call.
- What happens when the Credential Management API is unavailable in the user's
  browser? The app MUST inform the user that secure key storage is not supported in
  their browser and MUST NOT fall back to localStorage silently.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST display a home screen listing all existing conversations on
  startup, ordered by most-recently-active first.
- **FR-002**: Users MUST be able to create a new conversation by selecting an existing
  persona from a picker.
- **FR-003**: Users MUST be able to create a new persona by providing a name and a
  system prompt; profile image upload is optional.
- **FR-004**: Users MUST be able to upload a profile image when creating a persona,
  selecting from their device's local files; the image MUST be resized client-side
  before storage.
- **FR-005**: The system MUST persist all personas and conversation histories in
  browser-native local storage so data survives page reloads.
- **FR-006**: When the user sends a message, the chat screen MUST fire two parallel
  LLM calls simultaneously: one for the conversational reply (using the persona's
  system prompt and a sliding window of the last N messages as context) and one for
  grammar feedback. The AI reply MUST be displayed as soon as the reply call resolves,
  independently of the feedback call. N defaults to 8 and is user-configurable.
- **FR-007**: Every Chinese word or character in an assistant chat message
  MUST be tappable and trigger a pinyin and translation popup.
- **FR-008**: Users MUST be able to press-and-drag over a span of Chinese text in any
  assistant message to trigger a pinyin and translation popup for the selected phrase.
- **FR-009**: The grammar feedback call (fired in parallel with FR-006) MUST resolve
  independently and attach a feedback icon to the sent message bubble — green when
  correct, red when errors are present — as soon as its result arrives. A loading
  indicator MUST be shown on the bubble until the feedback call resolves or fails.
- **FR-016**: The settings screen MUST allow the user to configure the conversation
  context window size (N). The default value is 8. The setting MUST be persisted in
  browser-native local storage and applied to all subsequent LLM calls.
- **FR-010**: Tapping a green feedback icon MUST open a dialog showing the English
  translation of the user's sent message.
- **FR-011**: Tapping a red feedback icon MUST open a dialog showing the user's
  original message on top and the corrected version on the bottom, with a
  character-level diff where wrong/replaced parts are highlighted in red and
  added/missing parts are highlighted in green.
- **FR-012**: The app MUST remain navigable and display appropriate error states when
  the AI endpoint is unavailable; it MUST NOT crash or show a blank screen.
- **FR-013**: All user data (personas, conversations, messages) MUST be stored
  exclusively on the user's device; no data is transmitted to any server operated
  by this project.
- **FR-014**: The app MUST provide a settings screen where the user can enter their
  LLM API key. The key MUST be stored using the browser Credential Management API
  and MUST NOT be written to localStorage, sessionStorage, or any other plain-text
  client storage.
- **FR-015**: When no API key is stored, the app MUST prompt the user to enter one
  before any LLM call is attempted, and MUST display a clear explanation of why the
  key is needed.
- **FR-017**: The settings screen MUST allow the user to configure the LLM model
  string independently for each of the four call types: chat reply, grammar
  feedback, word translation, and phrase lookup. Each MUST default to
  `deepseek/deepseek-v3.2` for chat reply and grammar feedback,
  `openai/gpt-oss-120b` for word translation and phrase lookup) and MUST be
  persisted in browser-native local storage.

### Key Entities

- **Persona**: An AI conversation partner profile. Has a name, a system prompt (plain
  text passed as context to the LLM), and an optional profile image stored locally.
- **Conversation**: A named session linking one Persona to an ordered list of
  Messages. Carries creation and last-activity timestamps.
- **Message**: A single turn in a Conversation. Uses a discriminated union based
  on role: **UserMessage** carries an optional FeedbackResult and feedback status;
  **PersonaMessage** carries an optional array of AnnotatedWord (per-word pinyin
  and translation, matched from LLM output) and a translation status. Both share
  a base with id, conversationId, role, content, and a timestamp (native Date).
- **FeedbackResult**: Associated with a UserMessage. Contains a correctness flag,
  an English translation of the user's original text, and the corrected version
  of the text (empty string when correct). The character-level diff is computed
  at render time by the diff service — not stored in FeedbackResult.
- **AnnotatedWord**: A single word or character segment in a PersonaMessage,
  enriched with pinyin and English translation (or null for punctuation /
  unmatched characters). Produced by matching LLM-returned WordTranslation
  results to the actual message text via a client-side algorithm.
- **AppSettings**: Device-level configuration. Includes the LLM API key (stored via
  Credential Management API), the context window size N (stored in local storage,
  default 8), and per-action LLM model strings for chat reply, grammar feedback,
  word translation, and phrase lookup (each stored in local storage).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new user can create a persona and send their first message within
  2 minutes of opening the app for the first time.
- **SC-002**: Word-lookup popups appear within 2 seconds of a tap gesture on any
  Chinese text.
- **SC-003**: Grammar feedback icons appear on sent messages within 5 seconds of
  the message being sent (subject to AI endpoint availability).
- **SC-004**: All conversation history and personas survive a full browser or tab
  reload with zero data loss.
- **SC-005**: The app is fully navigable and all locally stored data remains
  accessible when the AI endpoint is offline.
- **SC-006**: The correction diff dialog correctly highlights wrong characters in red
  and added/missing characters in green for 100% of cases used in E2E test scenarios.

## Clarifications

### Session 2026-03-25

- Q: Where is the user's LLM API key entered and stored? → A: In-app settings screen; key stored via the browser Credential Management API (not localStorage) for secure on-device storage.
- Q: How are the chat reply and grammar feedback LLM calls structured per message? → A: Two separate parallel calls — chat reply and feedback are requested simultaneously; each result is shown in the UI as soon as it arrives.
- Q: How much conversation history is sent as context with each LLM call? → A: Sliding window of last N messages; default N=8, user-configurable in app settings.
- Q: What is the source for pinyin and translation lookups? → A: LLM via a single structured-output (JSON) call provides the translation for individual word translations. The drag tranlsations should trigger a separate API call.  

## Assumptions

- The app targets a single user per device; there is no multi-user or account system.
- The AI endpoint is an external third-party service (e.g., an OpenAI-compatible
  API); the user supplies their own API key via an in-app settings screen. The key is
  stored using the browser Credential Management API for secure on-device storage.
- The context window size N (default 8) is user-configurable via the settings screen
  and stored in local storage. Only the last N messages are sent as history with each
  LLM call.
- The primary target is a modern smartphone browser (mobile-first layout), though the
  app MUST also function on desktop browsers.
- Chinese text is Simplified Chinese (Mandarin); Traditional Chinese and other
  Sinitic languages are out of scope for v1.
- Persona deletion is out of scope for this feature; personas, once created, persist
  indefinitely.
- Profile images are stored as data URIs in local storage; large images MUST be
  resized client-side before storage to avoid exceeding storage quotas.
- The LLM is expected to return grammar feedback as structured data (correctness flag
  and diff); the prompt engineering to achieve this is a planning-phase concern.
