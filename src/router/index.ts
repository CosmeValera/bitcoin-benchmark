import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/PortfolioView.vue'),
    },
    {
      path: '/benchmark',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/simulator',
      component: () => import('../views/SimulatorView.vue'),
    },
  ],
})

export default router
