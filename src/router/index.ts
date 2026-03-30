import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/chat/:id',
      name: 'chat',
      component: () => import('@/views/ChatView.vue'),
    },
    {
      path: '/personas',
      name: 'personas',
      component: () => import('@/views/PersonaListView.vue'),
    },
    {
      path: '/personas/new',
      name: 'persona-new',
      component: () => import('@/components/persona/PersonaForm.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

export default router
