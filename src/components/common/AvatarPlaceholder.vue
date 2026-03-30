<script setup lang="ts">
const props = defineProps<{
  name: string
  avatarDataUri?: string | null
  size?: number
}>()

const initials = computed(() => {
  return props.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const sizeStyle = computed(() => {
  const s = props.size ?? 40
  return { width: `${s}px`, height: `${s}px`, fontSize: `${s * 0.4}px` }
})

import { computed } from 'vue'
</script>

<template>
  <img
    v-if="avatarDataUri"
    :src="avatarDataUri"
    :alt="name"
    class="avatar-img"
    :style="sizeStyle"
    data-testid="avatar-img"
  />
  <div
    v-else
    class="avatar-placeholder"
    :style="sizeStyle"
    data-testid="avatar-placeholder"
  >
    {{ initials }}
  </div>
</template>

<style scoped>
.avatar-img {
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  border-radius: 50%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
