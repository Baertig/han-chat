<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  word: string
  pinyin: string | null
  translation: string | null
  loading?: boolean
  anchorRect?: { top: number; left: number; width: number; height: number } | null
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const popupRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    emit('dismiss')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('dismiss')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    ref="popupRef"
    class="word-popup"
    data-testid="word-popup"
    :style="anchorRect ? {
      position: 'fixed',
      top: `${anchorRect.top - 8}px`,
      left: `${anchorRect.left + anchorRect.width / 2}px`,
      transform: 'translate(-50%, -100%)',
    } : {}"
  >
    <div v-if="loading" class="popup-loading" data-testid="popup-loading">
      Loading...
    </div>
    <template v-else-if="pinyin !== null && translation !== null">
      <div class="popup-word">{{ word }}</div>
      <div class="popup-pinyin" data-testid="popup-pinyin">{{ pinyin }}</div>
      <div class="popup-translation" data-testid="popup-translation">{{ translation }}</div>
    </template>
    <div v-else class="popup-no-translation" data-testid="popup-no-translation">
      No translation found
    </div>
  </div>
</template>

<style scoped>
.word-popup {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 200;
  min-width: 120px;
  text-align: center;
}

.popup-word {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.popup-pinyin {
  font-size: 14px;
  color: #6366f1;
  margin-bottom: 2px;
}

.popup-translation {
  font-size: 13px;
  color: #6b7280;
}

.popup-no-translation {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

.popup-loading {
  font-size: 13px;
  color: #9ca3af;
}
</style>
