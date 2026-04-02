import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadApiKey } from '@/services/credentials'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const apiKey = ref<string | null>(null)
    const contextWindowSize = ref(8)
    const chatModel = ref('deepseek/deepseek-v3.2')
    const feedbackModel = ref('deepseek/deepseek-v3.2')
    const translationModel = ref('google/gemini-2.5-flash-lite')
    const phraseLookupModel = ref('google/gemini-2.5-flash-lite')

    async function init(): Promise<void> {
      apiKey.value = await loadApiKey()
    }

    return {
      apiKey,
      contextWindowSize,
      chatModel,
      feedbackModel,
      translationModel,
      phraseLookupModel,
      init,
    }
  },
  {
    persist: {
      key: 'han-chat-settings',
      pick: [
        'contextWindowSize',
        'chatModel',
        'feedbackModel',
        'translationModel',
        'phraseLookupModel',
      ],
    },
  },
)
