<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonasStore } from '@/stores/personas'
import { resizeImage } from '@/services/image-resize'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const personasStore = usePersonasStore()

const name = ref('')
const systemPrompt = ref('')
const avatarDataUri = ref<string | null>(null)
const imagePreview = ref<string | null>(null)
const saving = ref(false)

const nameError = computed(() => {
  if (name.value.length > 0 && name.value.length <= 1) return 'Name must be more than 1 character'
  return null
})

const promptError = computed(() => {
  if (systemPrompt.value.length > 2000) return 'System prompt must be 2000 characters or less'
  return null
})

const canSave = computed(() => {
  return (
    name.value.trim().length > 1 &&
    systemPrompt.value.trim().length >= 1 &&
    systemPrompt.value.trim().length <= 2000 &&
    !saving.value
  )
})

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const dataUri = await resizeImage(file)
    avatarDataUri.value = dataUri
    imagePreview.value = dataUri
  } catch (err) {
    console.error('Image resize failed:', err)
  }
}

async function handleSave() {
  if (!canSave.value) return
  saving.value = true

  try {
    personasStore.addPersona({
      name: name.value.trim(),
      systemPrompt: systemPrompt.value.trim(),
      avatarDataUri: avatarDataUri.value,
    })
    router.push('/personas')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="persona-form-view">
    <header class="form-header">
      <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
      <h1>New Persona</h1>
    </header>

    <form class="form-content" @submit.prevent="handleSave">
      <div class="field">
        <label for="persona-name">Name</label>
        <input
          id="persona-name"
          v-model="name"
          type="text"
          placeholder="e.g. Chinese Tutor"
          data-testid="persona-name-input"
        />
        <span v-if="nameError" class="error">{{ nameError }}</span>
      </div>

      <div class="field">
        <label for="persona-prompt">System Prompt</label>
        <textarea
          id="persona-prompt"
          v-model="systemPrompt"
          rows="6"
          placeholder="Describe the persona's personality, speaking style, and difficulty level..."
          data-testid="persona-prompt-input"
        />
        <div class="char-count" :class="{ over: systemPrompt.length > 2000 }">
          {{ systemPrompt.length }} / 2000
        </div>
        <span v-if="promptError" class="error">{{ promptError }}</span>
      </div>

      <div class="field">
        <label>Profile Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          data-testid="persona-image-input"
          @change="handleImageUpload"
        />
        <img
          v-if="imagePreview"
          :src="imagePreview"
          alt="Preview"
          class="image-preview"
          data-testid="image-preview"
        />
      </div>

      <button
        type="submit"
        :disabled="!canSave"
        class="save-btn"
        data-testid="persona-save-btn"
      >
        {{ saving ? 'Saving...' : 'Save Persona' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.persona-form-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  max-width: var(--content-max-width);
  margin: 0 auto;
  width: 100%;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-main);
}

h1 {
  font-size: 18px;
  font-weight: 700;
}

.form-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-main);
}

input[type="text"],
textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
}

textarea {
  resize: vertical;
}

.char-count {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: right;
}

.char-count.over {
  color: var(--color-status-error);
}

.error {
  font-size: 13px;
  color: var(--color-status-error);
}

.image-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-top: 8px;
}

input[type="file"] {
  font-size: 14px;
}

.save-btn {
  padding: 12px;
  background: var(--color-accent);
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
