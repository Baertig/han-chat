<script setup lang="ts">
import { computed } from 'vue'
import { computeDiff } from '@/services/diff'
import type { FeedbackResult } from '@/types'

const props = defineProps<{
  originalContent: string
  feedback: FeedbackResult
}>()

defineEmits<{
  dismiss: []
}>()

const diffSegments = computed(() => {
  if (props.feedback.isCorrect) return []
  return computeDiff(props.originalContent, props.feedback.corrected)
})
</script>

<template>
  <div
    class="overlay"
    data-testid="correction-dialog"
    @click.self="$emit('dismiss')"
  >
    <div class="dialog">
      <button
        class="close-button"
        data-testid="correction-close"
        aria-label="Close"
        @click="$emit('dismiss')"
      >&times;</button>

      <!-- Green mode: correct -->
      <template v-if="feedback.isCorrect">
        <h3 class="heading">Translation</h3>
        <p class="translation-text" data-testid="correction-translation">
          {{ feedback.translation }}
        </p>
      </template>

      <!-- Red mode: incorrect -->
      <template v-else>
        <h3 class="heading">Original</h3>
        <p class="original-text" data-testid="correction-original">
          {{ originalContent }}
        </p>

        <h3 class="heading">Corrected</h3>
        <p class="corrected-text" data-testid="correction-corrected">
          <span
            v-for="(segment, index) in diffSegments"
            :key="index"
            :class="{
              removed: segment.type === 'removed',
              added: segment.type === 'added',
            }"
          >{{ segment.value }}</span>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  position: relative;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
}

.heading {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.heading + .heading {
  margin-top: 16px;
}

.translation-text,
.original-text,
.corrected-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 12px;
}

.removed {
  color: #ef4444;
  text-decoration: line-through;
}

.added {
  color: #22c55e;
  font-weight: 600;
}
</style>
