// ── Persona ──────────────────────────────────────────────
export interface Persona {
  id: string
  name: string
  systemPrompt: string
  avatarDataUri: string | null
  createdAt: Date
}

// ── Messages (discriminated union) ──────────────────────
export interface BaseMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface UserMessage extends BaseMessage {
  role: 'user'
  feedback: FeedbackResult | null
  feedbackStatus: 'pending' | 'resolved' | 'error' | null
}

export interface PersonaMessage extends BaseMessage {
  role: 'assistant'
  annotatedWords: AnnotatedWord[] | null
  wordTranslationStatus: 'pending' | 'resolved' | 'error' | null
}

export type Message = UserMessage | PersonaMessage

// ── Conversation ────────────────────────────────────────
export interface Conversation {
  id: string
  personaId: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

// ── Feedback ────────────────────────────────────────────
export interface FeedbackResult {
  isCorrect: boolean
  translation: string
  corrected: string
}

// ── Word Translation (LLM response intermediate) ───────
export interface WordTranslation {
  word: string
  pinyin: string
  translation: string
}

// ── Annotated Word (final render unit) ─────────────────
export interface AnnotatedWord {
  word: string
  pinyin: string | null
  translation: string | null
}

// ── Settings ────────────────────────────────────────────
export interface AppSettings {
  contextWindowSize: number
  chatModel: string
  feedbackModel: string
  translationModel: string
  phraseLookupModel: string
  apiKey: string | null
}

// ── Phrase Lookup (on-demand, not persisted) ────────────
export interface PhraseLookupResult {
  phrase: string
  pinyin: string
  translation: string
}
