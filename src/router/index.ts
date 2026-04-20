import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/PortfolioBuilderView.vue'),
    },
    {
      path: '/benchmark',
      component: () => import('../views/BenchmarkView.vue'),
    },
    {
      path: '/simulator',
      component: () => import('../views/DCASimulatorView.vue'),
    },
  ],
})

export default router
