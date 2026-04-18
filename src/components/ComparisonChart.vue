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
  Legend,
  Filler,
} from 'chart.js'
import { useComparisonStore } from '@/stores/comparison'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useComparisonStore()

const chartData = computed(() => {
  if (store.assetsData.length === 0) return { labels: [], datasets: [] }

  // Build a union of all dates across all assets, sorted chronologically
  const dateSet = new Set<string>()
  for (const { prices } of store.assetsData) {
    for (const p of prices) dateSet.add(p.date)
  }
  const allDates = [...dateSet].sort()

  const step = Math.max(1, Math.floor(allDates.length / 80))

  const labels = allDates.filter(
    (_, i) => i % step === 0 || i === allDates.length - 1,
  )
  const labelSet = new Set(labels)

  const datasets = store.assetsData.map(({ asset, prices, normalizedReturns }) => {
    // Map date → normalized return for this asset
    const dateToReturn = new Map<string, number>()
    for (let i = 0; i < prices.length; i++) {
      dateToReturn.set(prices[i].date, normalizedReturns[i])
    }

    // Produce data aligned to the shared label dates; null where data is missing
    const data = labels.map((d) => dateToReturn.get(d) ?? null)

    return {
      label: asset.name,
      data,
      borderColor: asset.color,
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      spanGaps: true,
    }
  })

  return { labels, datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#94a3b8',
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        font: { size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#e2e8f0',
      bodyColor: '#cbd5e1',
      borderColor: '#334155',
      borderWidth: 1,
      callbacks: {
        label: (ctx: any) => {
          const val = ctx.parsed.y
          const sign = val >= 0 ? '+' : ''
          return ` ${ctx.dataset.label}: ${sign}${val.toFixed(1)}%`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', maxTicksLimit: 12, font: { size: 11 } },
      grid: { color: 'rgba(148, 163, 184, 0.06)' },
    },
    y: {
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        callback: (val: any) => `${val >= 0 ? '+' : ''}${Number(val).toFixed(0)}%`,
      },
      grid: { color: 'rgba(148, 163, 184, 0.06)' },
    },
  },
}
</script>

<template>
  <section v-if="store.hasRun && store.assetsData.length" class="chart-panel">
    <div class="chart-header">
      <h2>Performance Comparison</h2>
      <span class="chart-hint">Normalized returns from start date</span>
    </div>
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

.chart-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
}

h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.chart-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.chart-container {
  height: 420px;
  position: relative;
}

@media (max-width: 600px) {
  .chart-header {
    flex-direction: column;
    gap: 0.25rem;
  }

  .chart-container {
    height: 300px;
  }
}
</style>
