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
import { useComparisonStore } from '@/stores/comparison'
import { useTheme } from '@/composables/useTheme'
import { useExport } from '@/composables/useExport'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useComparisonStore()
const { theme } = useTheme()
const { exportPng } = useExport()
const lineChart = ref<any>(null)

function downloadPng() {
  if (lineChart.value?.chart?.canvas) {
    exportPng(lineChart.value.chart.canvas)
  }
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

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
    // Map date → normalized return for this asset, optionally adjusted for dividends
    const dateToReturn = new Map<string, number>()
    const startDate = prices.length > 0 ? new Date(prices[0].date) : new Date()
    const startPrice = prices.length > 0 ? prices[0].price : 1
    const hasDividend = store.showDividendAdjusted && asset.dividendRate && asset.parValue

    for (let i = 0; i < prices.length; i++) {
      let ret = normalizedReturns[i]
      if (hasDividend) {
        const dayDate = new Date(prices[i].date)
        const years = (dayDate.getTime() - startDate.getTime()) / (365.25 * 86400000)
        const divAccrued = asset.dividendRate! * asset.parValue! * years
        ret += (divAccrued / startPrice) * 100
      }
      dateToReturn.set(prices[i].date, ret)
    }

    // Produce data aligned to the shared label dates;
    // carry forward last known value on weekends/holidays to avoid spikes
    let lastKnown: number | null = null
    const data = labels.map((d) => {
      const val = dateToReturn.get(d)
      if (val !== undefined) {
        lastKnown = val
        return val
      }
      return lastKnown
    })

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

const chartOptions = computed(() => {
  // Access theme.value so this recomputes on theme change
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
        position: 'top' as const,
        labels: {
          color: cssVar('--chart-legend'),
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12 },
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
  <section v-if="store.hasRun && store.assetsData.length" class="chart-panel">
    <div class="chart-header">
      <h2>Performance Comparison</h2>
      <div class="chart-header-right">
        <span class="chart-hint">Normalized returns from start date</span>
        <button class="export-btn" @click="downloadPng" title="Download PNG">PNG</button>
      </div>
    </div>
    <div class="chart-container">
      <Line ref="lineChart" :data="chartData" :options="chartOptions" />
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

.chart-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

.export-btn {
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: all 0.15s;
}

.export-btn:hover {
  border-color: var(--text-muted);
  color: var(--text);
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
