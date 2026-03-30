<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const text = ref('')

function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('send', trimmed)
  text.value = ''
}
</script>

<template>
  <form class="chat-input" @submit.prevent="handleSend" data-testid="chat-input-form">
    <textarea
      v-model="text"
      placeholder="Type a message..."
      rows="1"
      data-testid="chat-input"
      @keydown.enter.exact.prevent="handleSend"
    />
    <button
      type="submit"
      :disabled="!text.trim() || disabled"
      data-testid="send-btn"
    >
      Send
    </button>
  </form>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

textarea {
  flex: 1;
  resize: none;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.4;
}

button {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
