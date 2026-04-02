<script setup lang="ts">
import { usePersonasStore } from '@/stores/personas'
import PersonaCard from '@/components/persona/PersonaCard.vue'

const personasStore = usePersonasStore()

const emit = defineEmits<{
  picked: [personaId: string]
  cancel: []
}>()
</script>

<template>
  <div class="persona-picker-overlay" data-testid="persona-picker" @click.self="emit('cancel')">
    <div class="persona-picker">
      <h2>Choose a persona</h2>
      <div class="persona-list">
        <PersonaCard
          v-for="persona in personasStore.personas"
          :key="persona.id"
          :persona="persona"
          @select="(id) => emit('picked', id)"
        />
      </div>
      <button class="cancel-btn" @click="emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.persona-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.persona-picker {
  background: var(--color-bg-surface);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  color: var(--color-text-main);
}

h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.persona-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cancel-btn {
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  cursor: pointer;
  font-size: 14px;
}
</style>
