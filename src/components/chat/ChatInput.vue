<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const text = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isMobile = window.matchMedia('(pointer: coarse)').matches

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function handleEnterKey(event: KeyboardEvent) {
  if (event.shiftKey) return
  if (isMobile) return
  event.preventDefault()
  handleSend()
}

function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('send', trimmed)
  text.value = ''
  // Reset textarea height after send
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
  }
}
</script>

<template>
  <form class="chat-input" @submit.prevent="handleSend" data-testid="chat-input-form">
    <textarea
      ref="textareaRef"
      v-model="text"
      placeholder="Type a message..."
      rows="1"
      data-testid="chat-input"
      @keydown.enter="handleEnterKey"
      @input="autoResize"
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
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-surface);
}

textarea {
  flex: 1;
  resize: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.4;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  max-height: calc(16px * 1.4 * 3 + 16px + 2px);
  overflow-y: auto;
}

textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

button {
  padding: 8px 16px;
  background: var(--color-accent);
  color: #FFFFFF;
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
