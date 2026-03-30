<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import { isCredentialApiAvailable } from '@/services/credentials'
import { useSettingsStore } from '@/stores/settings'

const credentialUnavailable = ref(false)
const settingsStore = useSettingsStore()

onMounted(async () => {
  credentialUnavailable.value = !isCredentialApiAvailable()
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
  background: #fee2e2;
  border-bottom: 1px solid #ef4444;
  padding: 10px 16px;
  font-size: 13px;
  color: #991b1b;
  text-align: center;
}
</style>
