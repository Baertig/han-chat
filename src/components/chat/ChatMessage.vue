<script setup lang="ts">
import { ref } from 'vue'
import type { Message, AnnotatedWord } from '@/types'
import { translatePhrase } from '@/services/openrouter'
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder.vue'
import WordPopup from '@/components/chat/WordPopup.vue'
import FeedbackIcon from '@/components/chat/FeedbackIcon.vue'
import CorrectionDialog from '@/components/chat/CorrectionDialog.vue'

const props = defineProps<{
  message: Message
  personaName?: string
}>()

const emit = defineEmits<{
  retry: [messageId: string]
}>()

// Word popup state
const popupWord = ref<AnnotatedWord | null>(null)
const popupRect = ref<{ top: number; left: number; width: number; height: number } | null>(null)
const popupLoading = ref(false)
const phraseResult = ref<{ word: string; pinyin: string | null; translation: string | null } | null>(null)

// Drag state
const isDragging = ref(false)
const dragStartIdx = ref<number | null>(null)
const dragEndIdx = ref<number | null>(null)
let abortController: AbortController | null = null

// Feedback dialog state
const showFeedbackDialog = ref(false)

function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function handleWordTap(word: AnnotatedWord, event: MouseEvent, idx: number) {
  // Ignore taps during/after a drag
  if (isDragging.value) return

  const target = event.target as HTMLElement
  const rect = target.getBoundingClientRect()
  popupRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  popupWord.value = word
  phraseResult.value = null
  popupLoading.value = false
}

function dismissPopup() {
  popupWord.value = null
  popupRect.value = null
  popupLoading.value = false
  phraseResult.value = null
  isDragging.value = false
  dragStartIdx.value = null
  dragEndIdx.value = null
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

// Drag gesture handlers
function handlePointerDown(idx: number) {
  dragStartIdx.value = idx
  dragEndIdx.value = idx
  isDragging.value = false
}

function handlePointerMove(idx: number) {
  if (dragStartIdx.value === null) return
  if (idx !== dragStartIdx.value) {
    isDragging.value = true
  }
  dragEndIdx.value = idx
}

async function handlePointerUp(event: PointerEvent) {
  if (dragStartIdx.value === null || dragEndIdx.value === null) return
  if (!isDragging.value) {
    // Not a drag — let the click handler fire
    dragStartIdx.value = null
    dragEndIdx.value = null
    return
  }

  // Collect selected text from annotated words
  if (props.message.role !== 'assistant' || !props.message.annotatedWords) return

  const start = Math.min(dragStartIdx.value, dragEndIdx.value)
  const end = Math.max(dragStartIdx.value, dragEndIdx.value)
  const words = props.message.annotatedWords.slice(start, end + 1)
  const selectedText = words.map((w) => w.word).join('')

  // Position popup near release point
  const target = event.target as HTMLElement
  const rect = target.getBoundingClientRect()
  popupRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  popupLoading.value = true
  popupWord.value = { word: selectedText, pinyin: null, translation: null }

  dragStartIdx.value = null
  dragEndIdx.value = null

  // Fire phrase lookup
  abortController = new AbortController()
  try {
    const result = await translatePhrase(selectedText)
    if (!abortController.signal.aborted) {
      phraseResult.value = { word: result.phrase, pinyin: result.pinyin, translation: result.translation }
      popupWord.value = phraseResult.value
      popupLoading.value = false
    }
  } catch {
    if (!abortController?.signal.aborted) {
      popupWord.value = { word: selectedText, pinyin: null, translation: null }
      popupLoading.value = false
    }
  }
}

function isInDragRange(idx: number): boolean {
  if (dragStartIdx.value === null || dragEndIdx.value === null || !isDragging.value) return false
  const start = Math.min(dragStartIdx.value, dragEndIdx.value)
  const end = Math.max(dragStartIdx.value, dragEndIdx.value)
  return idx >= start && idx <= end
}
</script>

<template>
  <div
    class="chat-message"
    :class="{ 'is-user': message.role === 'user', 'is-assistant': message.role === 'assistant' }"
    :data-testid="message.role === 'user' ? 'message-user' : 'message-assistant'"
  >
    <AvatarPlaceholder
      v-if="message.role === 'assistant'"
      :name="personaName ?? 'AI'"
      :size="32"
    />
    <div class="bubble">
      <!-- Assistant message with annotated words -->
      <div
        v-if="message.role === 'assistant' && message.annotatedWords"
        class="content annotated"
      >
        <span
          v-for="(aw, idx) in message.annotatedWords"
          :key="idx"
          class="word-span"
          :class="{ tappable: aw.pinyin !== null, 'drag-selected': isInDragRange(idx) }"
          :data-testid="aw.pinyin !== null ? 'tappable-word' : undefined"
          @click="aw.pinyin !== null ? handleWordTap(aw, $event, idx) : undefined"
          @pointerdown.prevent="handlePointerDown(idx)"
          @pointermove="handlePointerMove(idx)"
          @pointerup="handlePointerUp($event)"
        >{{ aw.word }}</span>
      </div>

      <!-- Assistant message loading translation -->
      <div
        v-else-if="message.role === 'assistant' && message.wordTranslationStatus === 'pending'"
        class="content shimmer"
      >
        {{ message.content }}
      </div>

      <!-- Plain content (user messages or translation error/null) -->
      <div v-else class="content">{{ message.content }}</div>

      <!-- Feedback icon for user messages -->
      <FeedbackIcon
        v-if="message.role === 'user'"
        :feedback-status="message.feedbackStatus"
        :is-correct="message.feedback?.isCorrect ?? null"
        @click="showFeedbackDialog = true"
      />

      <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
    </div>

    <!-- Word popup -->
    <WordPopup
      v-if="popupWord"
      :word="popupWord.word"
      :pinyin="popupWord.pinyin"
      :translation="popupWord.translation"
      :loading="popupLoading"
      :anchor-rect="popupRect"
      @dismiss="dismissPopup"
    />

    <!-- Correction dialog -->
    <CorrectionDialog
      v-if="showFeedbackDialog && message.role === 'user' && message.feedback"
      :original-content="message.content"
      :feedback="message.feedback"
      @dismiss="showFeedbackDialog = false"
    />
  </div>
</template>

<style scoped>
.chat-message {
  display: flex;
  gap: 8px;
  margin: 8px 12px;
  max-width: 85%;
  position: relative;
}

.chat-message.is-user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.chat-message.is-assistant {
  margin-right: auto;
}

.bubble {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 100%;
  word-break: break-word;
}

.is-user .bubble {
  background: #6366f1;
  color: white;
  border-bottom-right-radius: 4px;
}

.is-assistant .bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.content {
  font-size: 15px;
  line-height: 1.5;
}

.content.shimmer {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.word-span {
  cursor: default;
}

.word-span.tappable {
  cursor: pointer;
  border-bottom: 1px dashed #9ca3af;
}

.word-span.tappable:hover {
  background: rgba(99, 102, 241, 0.1);
  border-radius: 2px;
}

.word-span.drag-selected {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 2px;
}

.timestamp {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}
</style>
