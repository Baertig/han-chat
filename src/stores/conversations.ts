import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  Conversation,
  Message,
  FeedbackResult,
  AnnotatedWord,
} from '@/types'

const DATE_REVIVER = (_key: string, value: unknown) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value)
  }
  return value
}

export const useConversationsStore = defineStore(
  'conversations',
  () => {
    const conversations = ref<Conversation[]>([])

    function createConversation(personaId: string): Conversation {
      const now = new Date()
      const conversation: Conversation = {
        id: crypto.randomUUID(),
        personaId,
        createdAt: now,
        updatedAt: now,
        messages: [],
      }
      conversations.value.push(conversation)
      return conversation
    }

    function getConversation(id: string): Conversation | undefined {
      return conversations.value.find((c) => c.id === id)
    }

    function addMessage(conversationId: string, message: Message): void {
      const conversation = getConversation(conversationId)
      if (!conversation) return
      conversation.messages.push(message)
      conversation.updatedAt = new Date()
    }

    function updateMessageFeedback(
      conversationId: string,
      messageId: string,
      feedback: FeedbackResult,
    ): void {
      const conversation = getConversation(conversationId)
      if (!conversation) return
      const message = conversation.messages.find((m) => m.id === messageId)
      if (message && message.role === 'user') {
        message.feedback = feedback
        message.feedbackStatus = 'resolved'
      }
    }

    function setMessageFeedbackError(
      conversationId: string,
      messageId: string,
    ): void {
      const conversation = getConversation(conversationId)
      if (!conversation) return
      const message = conversation.messages.find((m) => m.id === messageId)
      if (message && message.role === 'user') {
        message.feedbackStatus = 'error'
      }
    }

    function updateMessageTranslations(
      conversationId: string,
      messageId: string,
      annotatedWords: AnnotatedWord[],
    ): void {
      const conversation = getConversation(conversationId)
      if (!conversation) return
      const message = conversation.messages.find((m) => m.id === messageId)
      if (message && message.role === 'assistant') {
        message.annotatedWords = annotatedWords
        message.wordTranslationStatus = 'resolved'
      }
    }

    function setMessageTranslationError(
      conversationId: string,
      messageId: string,
    ): void {
      const conversation = getConversation(conversationId)
      if (!conversation) return
      const message = conversation.messages.find((m) => m.id === messageId)
      if (message && message.role === 'assistant') {
        message.wordTranslationStatus = 'error'
      }
    }

    const allConversationsSorted = computed(() =>
      [...conversations.value].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      ),
    )

    return {
      conversations,
      createConversation,
      getConversation,
      addMessage,
      updateMessageFeedback,
      setMessageFeedbackError,
      updateMessageTranslations,
      setMessageTranslationError,
      allConversationsSorted,
    }
  },
  {
    persist: {
      key: 'han-chat-conversations',
      serializer: {
        serialize: JSON.stringify,
        deserialize: (value: string) => JSON.parse(value, DATE_REVIVER),
      },
    },
  },
)
