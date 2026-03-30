import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Persona } from '@/types'

const DATE_REVIVER = (_key: string, value: unknown) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value)
  }
  return value
}

export const usePersonasStore = defineStore(
  'personas',
  () => {
    const personas = ref<Persona[]>([])

    function addPersona(data: Omit<Persona, 'id' | 'createdAt'>): Persona {
      const persona: Persona = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        ...data,
      }
      personas.value.push(persona)
      return persona
    }

    function getById(id: string): Persona | undefined {
      return personas.value.find((p) => p.id === id)
    }

    const allPersonas = computed(() => personas.value)

    return { personas, addPersona, getById, allPersonas }
  },
  {
    persist: {
      key: 'han-chat-personas',
      serializer: {
        serialize: JSON.stringify,
        deserialize: (value: string) => JSON.parse(value, DATE_REVIVER),
      },
    },
  },
)
