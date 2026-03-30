<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePersonasStore } from '@/stores/personas'
import { useConversationsStore } from '@/stores/conversations'
import PersonaCard from '@/components/persona/PersonaCard.vue'

const router = useRouter()
const personasStore = usePersonasStore()
const conversationsStore = useConversationsStore()

function startConversation(personaId: string) {
  const conversation = conversationsStore.createConversation(personaId)
  router.push(`/chat/${conversation.id}`)
}
</script>

<template>
  <div class="persona-list-view">
    <header class="list-header">
      <button class="back-btn" @click="router.push('/')">←</button>
      <h1>Personas</h1>
    </header>

    <div class="list-actions">
      <button
        class="new-persona-btn"
        data-testid="new-persona-btn"
        @click="router.push('/personas/new')"
      >
        + New Persona
      </button>
    </div>

    <div v-if="personasStore.personas.length === 0" class="empty-state">
      <p>No personas yet. Create one to get started.</p>
    </div>

    <div v-else class="persona-list" data-testid="persona-list">
      <PersonaCard
        v-for="persona in personasStore.personas"
        :key="persona.id"
        :persona="persona"
        @select="startConversation"
      />
    </div>
  </div>
</template>

<style scoped>
.persona-list-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

h1 {
  font-size: 18px;
  font-weight: 700;
}

.list-actions {
  padding: 16px;
}

.new-persona-btn {
  width: 100%;
  padding: 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  padding: 32px;
}

.persona-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
