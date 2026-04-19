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
        for (const ds of chart.data.datasets) {
          const val = ds.data[dataIndex]
          if (val == null) continue
          const sign = val >= 0 ? '+' : ''
          html += `<div class="crosshair-row"><span class="crosshair-dot" style="background:${ds.borderColor}"></span>${ds.label}: <strong>${sign}${val.toFixed(1)}%</strong></div>`
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
ChartJS.register(portfolioCrosshairPlugin)

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
    <div class="chart-container" @keydown="onKeydown" tabindex="0">
      <div class="crosshair-card"></div>
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
