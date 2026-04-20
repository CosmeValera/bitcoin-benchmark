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
import { useComparisonStore } from '@/stores/comparison'
import { useTheme } from '@/composables/useTheme'
import { useExport } from '@/composables/useExport'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Crosshair plugin
const crosshairPlugin = {
  id: 'crosshair',
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

    if (xPixel == null || xPixel < chartArea.left || xPixel > chartArea.right) return

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
        const rows: { label: string; color: string; val: number }[] = []
        for (const ds of chart.data.datasets) {
          if (ds.label.endsWith(' DD')) continue
          const val = ds.data[dataIndex]
          if (val == null) continue
          rows.push({ label: ds.label, color: ds.borderColor, val })
        }
        // Sort by value descending (highest percentage first)
        rows.sort((a, b) => b.val - a.val)
        for (const r of rows) {
          const sign = r.val >= 0 ? '+' : ''
          html += `<div class="crosshair-row"><span class="crosshair-dot" style="background:${r.color}"></span>${r.label}: <strong>${sign}${r.val.toFixed(1)}%</strong></div>`
        }
        cardEl.innerHTML = html
        cardEl.style.display = 'block'
        // Position horizontally near the crosshair
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
// Note: crosshairPlugin is passed as a local plugin via :plugins prop, not registered globally

const store = useComparisonStore()
const { theme } = useTheme()
const { exportPng } = useExport()
const lineChart = ref<any>(null)

// Reset pinned state when data changes
watch(() => store.assetsData, () => {
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

  // Add drawdown datasets if enabled
  if (store.showDrawdown) {
    for (const dd of store.drawdownData) {
      const dateToDD = new Map<string, number>()
      for (let i = 0; i < dd.dates.length; i++) {
        dateToDD.set(dd.dates[i], dd.drawdowns[i])
      }
      let lastKnownDD: number | null = null
      const data = labels.map((d) => {
        const val = dateToDD.get(d)
        if (val !== undefined) {
          lastKnownDD = val
          return val
        }
        return lastKnownDD
      })
      datasets.push({
        label: `${dd.asset.name} DD`,
        data,
        borderColor: dd.asset.color + '88',
        backgroundColor: dd.asset.color + '33',
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 1,
        spanGaps: true,
        borderDash: [3, 3],
        fill: 'origin',
      } as any)
    }
  }

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
          filter: (item: any) => !item.text.endsWith(' DD'),
        },
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
  <div v-if="store.hasRun && store.assetsData.length" class="chart-wrap">
    <div class="chart-header">
      <div class="chart-title-area">
        <h2>Performance Comparison</h2>
        <p class="chart-subtitle">Normalized returns from start date.</p>
      </div>
      <button class="export-btn" @click="downloadPng" title="Download PNG">PNG</button>
    </div>
    <div class="chart-container" @keydown="onKeydown" tabindex="0">
      <div class="crosshair-card"></div>
      <Line ref="lineChart" :data="chartData" :options="chartOptions" :plugins="[crosshairPlugin]" />
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
  flex-shrink: 0;
}

.export-btn:hover {
  border-color: var(--text-muted);
  color: var(--text);
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
