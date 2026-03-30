<script setup lang="ts">
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
    <span
      v-if="feedbackStatus === 'pending'"
      class="spinner"
      data-testid="feedback-loading"
      aria-label="Loading feedback"
    >&#x27F3;</span>

    <span
      v-else-if="feedbackStatus === 'error'"
      class="error"
      data-testid="feedback-error"
      aria-label="Feedback error"
    >&#x26A0;</span>

    <span
      v-else-if="feedbackStatus === 'resolved' && isCorrect === true"
      class="correct"
      data-testid="feedback-correct"
      aria-label="Correct"
    >&#x2713;</span>

    <span
      v-else-if="feedbackStatus === 'resolved' && isCorrect === false"
      class="incorrect"
      data-testid="feedback-incorrect"
      aria-label="Incorrect"
    >&#x2717;</span>
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
  color: #6b7280;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error {
  color: #9ca3af;
}

.correct {
  color: #22c55e;
}

.incorrect {
  color: #ef4444;
}
</style>
