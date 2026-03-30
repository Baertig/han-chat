<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { saveApiKey, isCredentialApiAvailable } from '@/services/credentials'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

const apiKeyInput = ref('')
const saving = ref(false)
const showNoKeyMessage = ref(false)
const credentialApiAvailable = ref(true)

onMounted(() => {
  credentialApiAvailable.value = isCredentialApiAvailable()
  if (route.query.reason === 'no-key') {
    showNoKeyMessage.value = true
  }
  if (settingsStore.apiKey) {
    apiKeyInput.value = '••••••••' // masked
  }
})

async function handleSaveApiKey() {
  if (!apiKeyInput.value.trim() || apiKeyInput.value === '••••••••') return
  saving.value = true
  try {
    await saveApiKey(apiKeyInput.value.trim())
    settingsStore.apiKey = apiKeyInput.value.trim()
    apiKeyInput.value = '••••••••'
    showNoKeyMessage.value = false
  } catch (err) {
    console.error('Failed to save API key:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="settings-view">
    <header class="settings-header">
      <button class="back-btn" @click="router.push('/')">←</button>
      <h1>Settings</h1>
    </header>

    <div class="settings-content">
      <div v-if="showNoKeyMessage" class="no-key-banner" data-testid="no-key-banner">
        You need to enter an OpenRouter API key to start chatting.
      </div>

      <div v-if="!credentialApiAvailable" class="warning-banner" data-testid="credential-unavailable">
        Secure credential storage is not available in your browser. API key cannot be stored.
      </div>

      <section class="setting-group">
        <h2>API Key</h2>
        <div class="input-row">
          <input
            v-model="apiKeyInput"
            type="password"
            placeholder="Enter OpenRouter API key"
            data-testid="api-key-input"
          />
          <button
            :disabled="saving || !apiKeyInput.trim() || apiKeyInput === '••••••••'"
            data-testid="save-api-key-btn"
            @click="handleSaveApiKey"
          >
            Save
          </button>
        </div>
      </section>

      <section class="setting-group">
        <h2>Context Window Size</h2>
        <div class="input-row">
          <input
            v-model.number="settingsStore.contextWindowSize"
            type="number"
            min="1"
            max="50"
            data-testid="context-window-input"
          />
          <span class="hint">Messages sent as context (1–50, default 8)</span>
        </div>
      </section>

      <section class="setting-group">
        <h2>Models</h2>
        <label>
          Chat Reply
          <input v-model="settingsStore.chatModel" data-testid="chat-model-input" />
        </label>
        <label>
          Grammar Feedback
          <input v-model="settingsStore.feedbackModel" data-testid="feedback-model-input" />
        </label>
        <label>
          Word Translation
          <input v-model="settingsStore.translationModel" data-testid="translation-model-input" />
        </label>
        <label>
          Phrase Lookup
          <input v-model="settingsStore.phraseLookupModel" data-testid="phrase-model-input" />
        </label>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

h1 {
  font-size: 18px;
  font-weight: 700;
}

.settings-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.no-key-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #92400e;
}

.warning-banner {
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #991b1b;
}

.setting-group h2 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

input[type="number"] {
  max-width: 80px;
}

button {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
}
</style>
