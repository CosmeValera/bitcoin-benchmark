<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { useSimulationStore } from '@/stores/simulation'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const store = useSimulationStore()

const chartData = computed(() => {
  if (!store.prices.length) return { labels: [], datasets: [] }

  const step = Math.max(1, Math.floor(store.prices.length / 60))
  const sampled = store.prices.filter((_, i) => i % step === 0 || i === store.prices.length - 1)

  return {
    labels: sampled.map((p) => p.date.toISOString().slice(0, 10)),
    datasets: [
      {
        label: 'BTC Price (USD)',
        data: sampled.map((p) => p.price),
        borderColor: '#f7931a',
        backgroundColor: 'rgba(247, 147, 26, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#e2e8f0',
      bodyColor: '#cbd5e1',
      borderColor: '#334155',
      borderWidth: 1,
      callbacks: {
        label: (ctx: any) =>
          `$${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', maxTicksLimit: 10 },
      grid: { color: 'rgba(148, 163, 184, 0.08)' },
    },
    y: {
      ticks: {
        color: '#64748b',
        callback: (val: any) => `$${Number(val).toLocaleString()}`,
      },
      grid: { color: 'rgba(148, 163, 184, 0.08)' },
    },
  },
}
</script>

<template>
  <section v-if="store.hasRun && store.prices.length" class="chart-panel">
    <h2>Bitcoin Price History</h2>
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<style scoped>
.chart-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.chart-container {
  height: 300px;
  position: relative;
}

@media (max-width: 500px) {
  .chart-container {
    height: 220px;
  }
}
</style>
