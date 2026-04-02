import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadApiKey } from '@/services/credentials'

export type TextSizePreset = 'small' | 'default' | 'large' | 'extra-large'

export const TEXT_SIZE_MAP: Record<TextSizePreset, string> = {
  'small': '14px',
  'default': '16px',
  'large': '18px',
  'extra-large': '20px',
}

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const apiKey = ref<string | null>(null)
    const contextWindowSize = ref(8)
    const chatModel = ref('deepseek/deepseek-v3.2')
    const feedbackModel = ref('deepseek/deepseek-v3.2')
    const translationModel = ref('google/gemini-2.5-flash-lite')
    const phraseLookupModel = ref('google/gemini-2.5-flash-lite')
    const textSize = ref<TextSizePreset>('default')

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
      textSize,
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
        'textSize',
      ],
    },
  },
)
