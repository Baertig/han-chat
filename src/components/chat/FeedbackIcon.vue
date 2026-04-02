<script setup lang="ts">
import { Loader2, AlertTriangle, Check, X } from 'lucide-vue-next'

defineProps<{
  feedbackStatus: 'pending' | 'resolved' | 'error' | null
  isCorrect: boolean | null
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    v-if="feedbackStatus !== null"
    class="feedback-icon"
    @click="$emit('click')"
  >
    <Loader2
      v-if="feedbackStatus === 'pending'"
      :size="16"
      class="spinner"
      data-testid="feedback-loading"
    />

    <AlertTriangle
      v-else-if="feedbackStatus === 'error'"
      :size="16"
      class="error"
      data-testid="feedback-error"
    />

    <Check
      v-else-if="feedbackStatus === 'resolved' && isCorrect === true"
      :size="16"
      class="correct"
      data-testid="feedback-correct"
    />

    <X
      v-else-if="feedbackStatus === 'resolved' && isCorrect === false"
      :size="16"
      class="incorrect"
      data-testid="feedback-incorrect"
    />
  </button>
</template>

<style scoped>
.feedback-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  animation: spin 1s linear infinite;
  color: var(--color-text-muted);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error {
  color: var(--color-text-muted);
}

.correct {
  color: var(--color-status-success);
}

.incorrect {
  color: var(--color-status-error);
}
</style>
