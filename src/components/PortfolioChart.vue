<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

// Crosshair plugin (same as ComparisonChart)
const portfolioCrosshairPlugin = {
  id: 'portfolioCrosshair',
  afterEvent(chart: any, args: any) {
    const event = args.event
    if (event.type === 'mouseout') {
      chart.$crosshairX = null
      chart.draw()
      return
    }
    if (event.type === 'click') {
      if (chart.$pinnedIndex != null) {
        chart.$pinnedIndex = null
      } else {
        const xScale = chart.scales.x
        const idx = xScale.getValueForPixel(event.x)
        if (idx != null && idx >= 0 && idx < chart.data.labels.length) {
          chart.$pinnedIndex = Math.round(idx)
        }
      }
      chart.draw()
      return
    }
    if (chart.$pinnedIndex == null) {
      chart.$crosshairX = event.x
      chart.draw()
    }
  },
  afterDraw(chart: any) {
    const { ctx, chartArea } = chart
    if (!chartArea) return

    let xPixel: number | null = null
    let dataIndex: number | null = null

    if (chart.$pinnedIndex != null) {
      const xScale = chart.scales.x
      xPixel = xScale.getPixelForValue(chart.$pinnedIndex)
      dataIndex = chart.$pinnedIndex
    } else if (chart.$crosshairX != null) {
      xPixel = chart.$crosshairX
      const xScale = chart.scales.x
      const idx = xScale.getValueForPixel(xPixel)
      if (idx != null) dataIndex = Math.round(idx)
    }

    if (xPixel == null || xPixel < chartArea.left || xPixel > chartArea.right) {
      const cardEl = chart.canvas?.parentElement?.querySelector('.crosshair-card') as HTMLElement | null
      if (cardEl) cardEl.style.display = 'none'
      return
    }

    // Draw vertical line
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(xPixel, chartArea.top)
    ctx.lineTo(xPixel, chartArea.bottom)
    ctx.lineWidth = 1
    ctx.strokeStyle = chart.$pinnedIndex != null
      ? getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f7931a'
      : (getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#999') + '88'
    if (chart.$pinnedIndex != null) {
      ctx.setLineDash([])
    } else {
      ctx.setLineDash([4, 3])
    }
    ctx.stroke()
    ctx.restore()

    // Update floating card
    if (dataIndex != null && chart.canvas) {
      const cardEl = chart.canvas.parentElement?.querySelector('.crosshair-card') as HTMLElement | null
      if (cardEl) {
        const label = chart.data.labels[dataIndex] || ''
        let html = `<div class="crosshair-date">${label}</div>`
        const rows: { label: string; color: string; val: number | null; isPortfolio: boolean; weightPct?: number; waiting: boolean }[] = []
        for (const ds of chart.data.datasets) {
          const val = ds.data[dataIndex]
          const isPortfolio = ds.label === 'Portfolio'
          // Show all assets: available ones with their value, unavailable as "Waiting"
          if (isPortfolio && val == null) continue
          rows.push({ label: ds.label, color: ds.borderColor, val, isPortfolio, weightPct: ds.weightPct, waiting: val == null })
        }
        // Portfolio first, then rest sorted by value descending (waiting assets at the bottom)
        const portfolio = rows.filter(r => r.isPortfolio)
        const rest = rows.filter(r => !r.isPortfolio).sort((a, b) => {
          if (a.waiting !== b.waiting) return a.waiting ? 1 : -1
          return (b.val ?? 0) - (a.val ?? 0)
        })
        for (const r of portfolio) {
          const sign = (r.val ?? 0) >= 0 ? '+' : ''
          html += `<div class="crosshair-row"><span class="crosshair-dot" style="background:${r.color}"></span>${r.label}: <strong>${sign}${(r.val ?? 0).toFixed(1)}%</strong></div>`
        }
        if (portfolio.length && rest.length) {
          html += `<div class="crosshair-separator"></div>`
        }
        for (const r of rest) {
          const weight = r.weightPct != null ? `<span class="crosshair-weight">${r.weightPct.toFixed(0)}%</span>` : ''
          if (r.waiting) {
            html += `<div class="crosshair-row crosshair-waiting"><span class="crosshair-dot" style="background:${r.color}"></span>${weight}${r.label}: <strong>Waiting</strong></div>`
          } else {
            const sign = (r.val ?? 0) >= 0 ? '+' : ''
            html += `<div class="crosshair-row"><span class="crosshair-dot" style="background:${r.color}"></span>${weight}${r.label}: <strong>${sign}${(r.val ?? 0).toFixed(1)}%</strong></div>`
          }
        }
        cardEl.innerHTML = html
        cardEl.style.display = 'block'
        const rect = chart.canvas.getBoundingClientRect()
        const cardWidth = cardEl.offsetWidth || 160
        let left = xPixel - cardWidth / 2
        if (left < chartArea.left) left = chartArea.left
        if (left + cardWidth > chartArea.right) left = chartArea.right - cardWidth
        cardEl.style.left = `${left}px`
      }
    }
  },
}
// Note: portfolioCrosshairPlugin is passed as a local plugin via :plugins prop, not registered globally

const store = usePortfolioStore()
const { theme } = useTheme()
const { exportPng } = useExport()
const lineChart = ref<any>(null)

// Reset pinned state when data changes
watch(() => store.result, () => {
  if (lineChart.value?.chart) {
    lineChart.value.chart.$pinnedIndex = null
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && lineChart.value?.chart?.$pinnedIndex != null) {
    lineChart.value.chart.$pinnedIndex = null
    lineChart.value.chart.draw()
  }
}

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
  // Also build per-asset date→return maps for dividend-adjusted blend
  const total = store.totalWeight || 1
  const assetDateMaps: { id: string; dateToReturn: Map<string, number> }[] = []
  const assetDatasets = assetData.map(({ asset, prices, normalizedReturns }) => {
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
    assetDateMaps.push({ id: asset.id, dateToReturn })
    let lastVal: number | null = null
    const data = labels.map((d) => {
      const val = dateToReturn.get(d)
      if (val != null) {
        lastVal = val
        return val
      }
      return lastVal
    })
    const rawWeight = store.allocations[asset.id] ?? 0
    const weightPct = (rawWeight / total) * 100
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
      weightPct,
    }
  })

  // Blended portfolio line (thick, accent color)
  // When dividends are enabled, recompute blend from dividend-adjusted returns
  let blendedData: (number | null)[]
  if (store.showDividendAdjusted) {
    // Normalize weights
    const activeWeights = Object.entries(store.allocations).filter(([, w]) => w > 0)
    const rawTotal = activeWeights.reduce((s, [, w]) => s + w, 0)
    const normalizedWeights: Record<string, number> = {}
    for (const [id, w] of activeWeights) {
      normalizedWeights[id] = (w / rawTotal) * 100
    }
    // For each label date, blend using last known dividend-adjusted return
    const lastKnown = new Map<string, number>()
    // We need all dates (not just sampled labels) to carry forward correctly
    // Use the blendedReturns dates as the full date list
    const allDates = blendedReturns.map((br) => br.date)
    const labelSet = new Set(labels)
    const blendedMap = new Map<string, number>()
    for (const date of allDates) {
      for (const { id, dateToReturn } of assetDateMaps) {
        const ret = dateToReturn.get(date)
        if (ret != null) lastKnown.set(id, ret)
      }
      if (!labelSet.has(date)) continue
      let weightedReturn = 0
      for (const { id } of assetDateMaps) {
        const ret = lastKnown.get(id) ?? 0
        const weight = normalizedWeights[id] ?? 0
        weightedReturn += (ret * weight) / 100
      }
      blendedMap.set(date, weightedReturn)
    }
    blendedData = labels.map((d) => blendedMap.get(d) ?? null)
  } else {
    const dateToBlend = new Map<string, number>()
    for (const br of blendedReturns) {
      dateToBlend.set(br.date, br.value)
    }
    blendedData = labels.map((d) => dateToBlend.get(d) ?? null)
  }

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
        enabled: false,
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
    <div class="chart-container" @keydown="onKeydown" tabindex="0">
      <div class="crosshair-card"></div>
      <Line ref="lineChart" :data="chartData" :options="chartOptions" :plugins="[portfolioCrosshairPlugin]" />
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
  font-family: 'JetBrains Mono', monospace;
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

.crosshair-card {
  display: none;
  position: absolute;
  top: 4px;
  z-index: 10;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.72rem;
  pointer-events: none;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.crosshair-card :deep(.crosshair-date) {
  font-weight: 700;
  margin-bottom: 0.2rem;
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
}

.crosshair-card :deep(.crosshair-row) {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--text-muted);
  line-height: 1.5;
  white-space: nowrap;
}

.crosshair-card :deep(.crosshair-separator) {
  border-top: 1px solid var(--text-muted);
  opacity: 0.3;
  margin: 0.2rem 0;
}

.crosshair-card :deep(.crosshair-waiting) {
  opacity: 0.45;
  font-style: italic;
}

.crosshair-card :deep(.crosshair-weight) {
  font-size: 0.65rem;
  background: var(--card-bg);
  border: 1px solid var(--text-muted);
  border-radius: 3px;
  padding: 0 0.25rem;
  margin-right: 0.25rem;
  opacity: 0.7;
  min-width: 2rem;
  text-align: center;
  display: inline-block;
}

.crosshair-card :deep(.crosshair-dot) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.crosshair-card :deep(strong) {
  color: var(--text);
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
