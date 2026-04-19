<script setup lang="ts">
import { computed, ref } from 'vue'
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
import { usePortfolioStore } from '@/stores/portfolio'
import { useTheme } from '@/composables/useTheme'
import { useExport } from '@/composables/useExport'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = usePortfolioStore()
const { theme } = useTheme()
const { exportPng } = useExport()
const lineChart = ref<any>(null)

function downloadPng() {
  if (lineChart.value?.chart?.canvas) {
    exportPng(lineChart.value.chart.canvas, 'portfolio.png')
  }
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartData = computed(() => {
  if (!store.result) return { labels: [], datasets: [] }

  const { blendedReturns, assetData } = store.result

  const step = Math.max(1, Math.floor(blendedReturns.length / 80))
  const labels = blendedReturns
    .filter((_, i) => i % step === 0 || i === blendedReturns.length - 1)
    .map((br) => br.date)

  // Individual asset lines (thin, semi-transparent)
  const assetDatasets = assetData.map(({ asset, prices, normalizedReturns }) => {
    const dateToReturn = new Map<string, number>()
    for (let i = 0; i < prices.length; i++) {
      dateToReturn.set(prices[i].date, normalizedReturns[i])
    }
    let lastVal: number | null = null
    const data = labels.map((d) => {
      const val = dateToReturn.get(d)
      if (val != null) {
        lastVal = val
        return val
      }
      return lastVal
    })
    return {
      label: asset.name,
      data,
      borderColor: asset.color + '88',
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1.5,
      borderDash: [4, 2],
      spanGaps: true,
    }
  })

  // Blended portfolio line (thick, accent color)
  const dateToBlend = new Map<string, number>()
  for (const br of blendedReturns) {
    dateToBlend.set(br.date, br.value)
  }
  const blendedData = labels.map((d) => dateToBlend.get(d) ?? null)

  const portfolioDataset = {
    label: 'Portfolio',
    data: blendedData,
    borderColor: cssVar('--accent'),
    backgroundColor: 'transparent',
    tension: 0.3,
    pointRadius: 0,
    pointHoverRadius: 5,
    borderWidth: 3,
    spanGaps: true,
  }

  return { labels, datasets: [portfolioDataset, ...assetDatasets] }
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
        display: false,
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
            const sign = val >= 0 ? '+' : ''
            return ` ${ctx.dataset.label}: ${sign}${val.toFixed(1)}%`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: cssVar('--chart-tick'), maxTicksLimit: 12, font: { size: 11 } },
        grid: { color: cssVar('--chart-grid') },
      },
      y: {
        ticks: {
          color: cssVar('--chart-tick'),
          font: { size: 11 },
          callback: (val: any) => `${val >= 0 ? '+' : ''}${Number(val).toFixed(0)}%`,
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
        <h2>Portfolio Performance</h2>
        <p class="chart-subtitle">Weighted blended returns over the selected window.</p>
      </div>
      <div class="chart-legend">
        <span class="legend-item">
          <span class="legend-dot accent"></span>
          Portfolio
        </span>
        <span class="legend-item">
          <span class="legend-dot muted"></span>
          Benchmark
        </span>
      </div>
    </div>
    <div class="chart-container">
      <Line ref="lineChart" :data="chartData" :options="chartOptions" />
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

.chart-legend {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.accent {
  background: var(--accent);
}

.legend-dot.muted {
  background: var(--text-muted);
  opacity: 0.5;
}

.chart-container {
  height: 380px;
  position: relative;
  background: var(--card-inner-bg, var(--bg));
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
}

@media (max-width: 600px) {
  .chart-header {
    flex-direction: column;
    gap: 0.25rem;
  }
  .chart-container {
    height: 280px;
  }
}
</style>
