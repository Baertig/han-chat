<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConversationsStore } from '@/stores/conversations'
import { usePersonasStore } from '@/stores/personas'
import PersonaPicker from '@/components/persona/PersonaPicker.vue'
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder.vue'

const router = useRouter()
const conversationsStore = useConversationsStore()
const personasStore = usePersonasStore()

const showPicker = ref(false)

onMounted(() => {
  // Seed default persona on first run
  if (personasStore.personas.length === 0) {
    personasStore.addPersona({
      name: 'Chinese Tutor',
      systemPrompt:
        'You are a friendly Chinese language tutor. Respond in Simplified Chinese. Keep responses concise and conversational.',
      avatarDataUri: null,
    })
  }
})

function startConversation(personaId: string) {
  showPicker.value = false
  const conversation = conversationsStore.createConversation(personaId)
  router.push(`/chat/${conversation.id}`)
}

function openConversation(id: string) {
  router.push(`/chat/${id}`)
}

function getPersonaName(personaId: string): string {
  return personasStore.getById(personaId)?.name ?? 'Deleted persona'
}

function getLastMessagePreview(messages: { content: string }[]): string {
  if (messages.length === 0) return 'No messages yet'
  const last = messages[messages.length - 1]
  if (!last) return 'No messages yet'
  return last.content.length > 50 ? last.content.slice(0, 50) + '...' : last.content
}

function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="home-view">
    <header class="home-header">
      <h1>Han Chat</h1>
      <button
        data-testid="settings-btn"
        class="icon-btn"
        @click="router.push('/settings')"
      >
        ⚙
      </button>
    </header>

    <div class="actions">
      <button
        data-testid="new-conversation-btn"
        class="action-btn primary"
        @click="showPicker = true"
      >
        New conversation
      </button>
      <button
        data-testid="new-persona-btn"
        class="action-btn"
        @click="router.push('/personas/new')"
      >
        New persona
      </button>
    </div>

    <div v-if="conversationsStore.allConversationsSorted.length === 0" class="empty-state" data-testid="empty-state">
      <p>No conversations yet. Start one!</p>
    </div>

    <div v-else class="conversation-list">
      <button
        v-for="conv in conversationsStore.allConversationsSorted"
        :key="conv.id"
        class="conversation-item"
        data-testid="conversation-item"
        @click="openConversation(conv.id)"
      >
        <AvatarPlaceholder :name="getPersonaName(conv.personaId)" :size="44" />
        <div class="conv-info">
          <div class="conv-top">
            <span class="conv-name">{{ getPersonaName(conv.personaId) }}</span>
            <span class="conv-time">{{ formatDate(conv.updatedAt) }}</span>
          </div>
          <div class="conv-preview">{{ getLastMessagePreview(conv.messages) }}</div>
        </div>
      </button>
    </div>

    <PersonaPicker
      v-if="showPicker"
      @picked="startConversation"
      @cancel="showPicker = false"
    />
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

h1 {
  font-size: 20px;
  font-weight: 700;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.actions {
  display: flex;
  gap: 8px;
  padding: 16px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn.primary {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  padding: 32px;
  text-align: center;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: white;
  cursor: pointer;
  text-align: left;
}

.conversation-item:hover {
  background: #f9fafb;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.conv-name {
  font-weight: 600;
  font-size: 15px;
}

.conv-time {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

.conv-preview {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
