<script setup lang="ts">
import type { Persona } from '@/types'
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder.vue'

defineProps<{
  persona: Persona
}>()

const emit = defineEmits<{
  select: [personaId: string]
}>()
</script>

<template>
  <button
    class="persona-card"
    data-testid="persona-card"
    @click="emit('select', persona.id)"
  >
    <AvatarPlaceholder :name="persona.name" :avatar-data-uri="persona.avatarDataUri" :size="48" />
    <div class="info">
      <div class="name">{{ persona.name }}</div>
      <div class="prompt-preview">{{ persona.systemPrompt.slice(0, 60) }}{{ persona.systemPrompt.length > 60 ? '...' : '' }}</div>
    </div>
  </button>
</template>

<style scoped>
.persona-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-surface);
  cursor: pointer;
  text-align: left;
  color: var(--color-text-main);
}

.persona-card:hover {
  background: var(--color-bg-main);
}

.name {
  font-weight: 600;
  font-size: 15px;
}

.prompt-preview {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
</style>
