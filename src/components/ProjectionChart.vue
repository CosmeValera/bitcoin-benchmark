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
import { useProjectionStore } from '@/stores/projection'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useProjectionStore()
const { theme } = useTheme()

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartData = computed(() => {
  if (!store.result) return { labels: [], datasets: [] }

  const r = store.result
  // Show one label per year
  const step = 12
  const indices = r.years
    .map((_, i) => i)
    .filter((i) => i % step === 0 || i === r.years.length - 1)

  const labels = indices.map((i) => {
    const y = r.years[i]
    return y === 0 ? 'Start' : `Year ${Math.round(y)}`
  })

  return {
    labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: indices.map((i) => r.portfolioValues[i]),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2.5,
      },
      {
        label: 'Total Contributions',
        data: indices.map((i) => r.totalContributions[i]),
        borderColor: cssVar('--text-muted'),
        backgroundColor: 'transparent',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
        borderDash: [4, 3],
      },
      {
        label: 'Interest Earned',
        data: indices.map((i) => r.totalInterest[i]),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.06)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  }
})

const chartOptions = computed(() => {
  void theme.value
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: cssVar('--chart-legend'),
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: cssVar('--chart-tooltip-bg'),
        titleColor: cssVar('--chart-tooltip-title'),
        bodyColor: cssVar('--chart-tooltip-body'),
        borderColor: cssVar('--chart-tooltip-border'),
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y
            return ` ${ctx.dataset.label}: $${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: cssVar('--chart-tick'), font: { size: 11 } },
        grid: { color: cssVar('--chart-grid') },
      },
      y: {
        ticks: {
          color: cssVar('--chart-tick'),
          font: { size: 11 },
          callback: (val: any) => `$${Number(val).toLocaleString()}`,
        },
        grid: { color: cssVar('--chart-grid') },
      },
    },
  }
})
</script>

<template>
  <div v-if="store.hasRun && store.result" class="chart-wrap">
    <div class="chart-header">
      <div class="chart-title-area">
        <h2>Compound Growth Projection</h2>
        <p class="chart-subtitle">Projected portfolio value with compound interest over time.</p>
      </div>
    </div>
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.chart-title-area {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.chart-subtitle {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.chart-container {
  height: 380px;
  position: relative;
  background: var(--card-inner-bg, var(--bg));
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
}

@media (max-width: 500px) {
  .chart-container {
    height: 280px;
  }
}
</style>
