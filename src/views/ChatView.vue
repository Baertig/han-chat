<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConversationsStore } from '@/stores/conversations'
import { usePersonasStore } from '@/stores/personas'
import { useSettingsStore } from '@/stores/settings'
import { chatReply, translateMessage, grammarFeedback } from '@/services/openrouter'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder.vue'
import type { UserMessage, PersonaMessage } from '@/types'

const route = useRoute()
const router = useRouter()
const conversationsStore = useConversationsStore()
const personasStore = usePersonasStore()
const settingsStore = useSettingsStore()

const messagesContainer = ref<HTMLElement | null>(null)
const isSending = ref(false)
const chatError = ref<string | null>(null)
const failedMessageText = ref<string | null>(null)

const conversationId = computed(() => route.params.id as string)

const conversation = computed(() =>
  conversationsStore.getConversation(conversationId.value),
)

const persona = computed(() => {
  if (!conversation.value) return undefined
  return personasStore.getById(conversation.value.personaId)
})

const personaName = computed(() => persona.value?.name ?? 'Deleted persona')

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
})

async function handleSend(text: string) {
  if (!conversation.value || !persona.value) return

  // API key guard
  if (!settingsStore.apiKey) {
    router.push('/settings?reason=no-key')
    return
  }

  isSending.value = true

  // Create and add user message with pending feedback
  const userMessage: UserMessage = {
    id: crypto.randomUUID(),
    conversationId: conversationId.value,
    role: 'user',
    content: text,
    timestamp: new Date(),
    feedback: null,
    feedbackStatus: 'pending',
  }
  conversationsStore.addMessage(conversationId.value, userMessage)
  await scrollToBottom()

  // Fire grammar feedback in parallel (independent of chat reply)
  const feedbackPromise = grammarFeedback(text)
    .then((fb) => {
      conversationsStore.updateMessageFeedback(conversationId.value, userMessage.id, fb)
    })
    .catch(() => {
      conversationsStore.setMessageFeedbackError(conversationId.value, userMessage.id)
    })

  // Fire chat reply
  try {
    const messages = conversation.value.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const replyContent = await chatReply(messages, persona.value.systemPrompt)

    const assistantMessage: PersonaMessage = {
      id: crypto.randomUUID(),
      conversationId: conversationId.value,
      role: 'assistant',
      content: replyContent,
      timestamp: new Date(),
      annotatedWords: null,
      wordTranslationStatus: 'pending',
    }
    conversationsStore.addMessage(conversationId.value, assistantMessage)
    await scrollToBottom()

    // Fire translation pre-fetch sequentially after chat reply
    translateMessage(replyContent)
      .then((annotatedWords) => {
        conversationsStore.updateMessageTranslations(
          conversationId.value,
          assistantMessage.id,
          annotatedWords,
        )
      })
      .catch(() => {
        conversationsStore.setMessageTranslationError(
          conversationId.value,
          assistantMessage.id,
        )
      })
  } catch (err) {
    console.error('Chat reply failed:', err)
    chatError.value = 'Failed to get a reply. Tap to retry.'
    failedMessageText.value = text
  } finally {
    isSending.value = false
  }

  // Ensure feedback completes (don't block UI on it)
  await feedbackPromise.catch(() => {})
}

async function handleRetry() {
  if (failedMessageText.value) {
    chatError.value = null
    const text = failedMessageText.value
    failedMessageText.value = null
    await handleSend(text)
  }
}
</script>

<template>
  <div class="chat-view">
    <header class="chat-header">
      <button class="back-btn" data-testid="back-btn" @click="router.push('/')">
        ←
      </button>
      <AvatarPlaceholder :name="personaName" :size="32" />
      <span class="persona-name" data-testid="persona-name">{{ personaName }}</span>
    </header>

    <div
      v-if="conversation"
      ref="messagesContainer"
      class="messages"
      data-testid="messages-container"
    >
      <ChatMessage
        v-for="msg in conversation.messages"
        :key="msg.id"
        :message="msg"
        :persona-name="personaName"
      />
    </div>

    <div v-else class="not-found">
      <p>Conversation not found.</p>
    </div>

    <ChatInput
      :disabled="isSending"
      @send="handleSend"
    />

    <div v-if="chatError" class="chat-error" data-testid="chat-error">
      <span>{{ chatError }}</span>
      <button class="retry-btn" data-testid="retry-btn" @click="handleRetry">Retry</button>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

.persona-name {
  font-weight: 600;
  font-size: 16px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.not-found {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.chat-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fef2f2;
  border-top: 1px solid #fecaca;
  font-size: 13px;
  color: #991b1b;
}

.retry-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
</style>
