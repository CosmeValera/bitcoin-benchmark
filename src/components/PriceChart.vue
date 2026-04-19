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
import { useSimulationStore } from '@/stores/simulation'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useSimulationStore()
const { theme } = useTheme()

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartData = computed(() => {
  if (!store.prices.length) return { labels: [], datasets: [] }

  const r = store.result
  const step = Math.max(1, Math.floor(store.prices.length / 60))
  const indices = store.prices
    .map((_, i) => i)
    .filter((i) => i % step === 0 || i === store.prices.length - 1)

  const labels = indices.map((i) => store.prices[i].date.toISOString().slice(0, 10))

  const datasets: any[] = [
    {
      label: 'BTC Price (USD)',
      data: indices.map((i) => store.prices[i].price),
      borderColor: '#f7931a',
      backgroundColor: 'rgba(247, 147, 26, 0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
      yAxisID: 'yPrice',
    },
  ]

  // Overlay DCA and Lump Sum portfolio values if simulation has run
  if (r) {
    datasets.push({
      label: 'DCA Portfolio Value',
      data: indices.map((i) => r.dcaPortfolioValues[i] ?? null),
      borderColor: '#22c55e',
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
      yAxisID: 'yPortfolio',
    })
    datasets.push({
      label: 'Lump Sum Portfolio Value',
      data: indices.map((i) => r.lumpSumPortfolioValues[i] ?? null),
      borderColor: '#a855f7',
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
      yAxisID: 'yPortfolio',
    })
    datasets.push({
      label: 'Total Invested',
      data: indices.map((i) => r.dcaTotalInvested[i] ?? null),
      borderColor: cssVar('--text-muted'),
      backgroundColor: 'transparent',
      tension: 0,
      pointRadius: 0,
      borderWidth: 1,
      borderDash: [2, 2],
      yAxisID: 'yPortfolio',
    })
  }

  return { labels, datasets }
})

const chartOptions = computed(() => {
  void theme.value
  const hasResult = !!store.result
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: hasResult,
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
            return ` ${ctx.dataset.label}: $${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: cssVar('--chart-tick'), maxTicksLimit: 10, font: { size: 11 } },
        grid: { color: cssVar('--chart-grid') },
      },
      yPrice: {
        type: 'linear' as const,
        position: 'left' as const,
        ticks: {
          color: '#f7931a',
          font: { size: 11 },
          callback: (val: any) => `$${Number(val).toLocaleString()}`,
        },
        grid: { color: cssVar('--chart-grid') },
        title: {
          display: hasResult,
          text: 'BTC Price',
          color: '#f7931a',
          font: { size: 11 },
        },
      },
      ...(hasResult
        ? {
            yPortfolio: {
              type: 'linear' as const,
              position: 'right' as const,
              ticks: {
                color: '#22c55e',
                font: { size: 11 },
                callback: (val: any) => `$${Number(val).toLocaleString()}`,
              },
              grid: { drawOnChartArea: false },
              title: {
                display: true,
                text: 'Portfolio Value',
                color: '#22c55e',
                font: { size: 11 },
              },
            },
          }
        : {}),
    },
  }
})
</script>

<template>
  <div v-if="store.hasRun && store.prices.length" class="chart-wrap">
    <div class="chart-header">
      <div class="chart-title-area">
        <h2>Bitcoin Price &amp; Portfolio Value</h2>
        <p class="chart-subtitle">BTC price overlaid with DCA and lump sum portfolio growth.</p>
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
