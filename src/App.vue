<script setup lang="ts">
import '@/assets/theme.css'
import '@/assets/main.css'
import { onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { isCredentialApiAvailable } from '@/services/credentials'
import { useSettingsStore, TEXT_SIZE_MAP } from '@/stores/settings'

const credentialUnavailable = ref(false)
const settingsStore = useSettingsStore()

function applyTextSize() {
  document.documentElement.style.setProperty(
    '--text-size-base',
    TEXT_SIZE_MAP[settingsStore.textSize],
  )
}

watch(() => settingsStore.textSize, applyTextSize)

onMounted(async () => {
  credentialUnavailable.value = !isCredentialApiAvailable()
  applyTextSize()
  await settingsStore.init()
})
</script>

<template>
  <div v-if="credentialUnavailable" class="credential-banner" data-testid="credential-unavailable">
    Secure credential storage is not available in your browser. API key cannot be stored.
  </div>
  <RouterView />
</template>

<style>
.credential-banner {
  background: var(--color-status-error);
  border-bottom: 1px solid var(--color-border);
  padding: 10px 16px;
  font-size: calc(var(--text-size-base) - 3px);
  color: var(--color-text-main);
  text-align: center;
}
</style>
