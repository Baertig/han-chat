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
let clickListenerTimer: ReturnType<typeof setTimeout> | null = null

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
  // Defer click-outside listener by one tick so the originating click/pointerup
  // event that opened this popup doesn't immediately dismiss it.
  clickListenerTimer = setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true)
  }, 0)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (clickListenerTimer !== null) {
    clearTimeout(clickListenerTimer)
  }
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
    <button
      class="popup-close"
      data-testid="popup-close"
      aria-label="Close"
      @click.stop="emit('dismiss')"
    >&times;</button>
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
  position: relative;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 200;
  min-width: 120px;
  text-align: center;
}

.popup-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 18px;
  padding: 0;
  color: #9ca3af;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-close:hover {
  color: #6b7280;
  background: rgba(0, 0, 0, 0.05);
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
