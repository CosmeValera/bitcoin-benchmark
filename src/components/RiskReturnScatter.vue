<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bubble } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useComparisonStore } from '@/stores/comparison'
import { useTheme } from '@/composables/useTheme'
import { useExport } from '@/composables/useExport'

ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

const store = useComparisonStore()
const { theme } = useTheme()
const { exportPng } = useExport()
const chartRef = ref<any>(null)

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function downloadPng() {
  if (chartRef.value?.chart?.canvas) {
    exportPng(chartRef.value.chart.canvas)
  }
}

/** Abbreviate long names for labels */
function shortName(name: string): string {
  const match = name.match(/\(([^)]+)\)/)
  if (match) return match[1]
  if (name.length <= 10) return name
  return name.slice(0, 8) + '..'
}

const chartData = computed(() => {
  if (store.metrics.length === 0) return { datasets: [] }

  const datasets = store.metrics.map((m) => ({
    label: m.asset.name,
    data: [
      {
        x: m.volatility,
        y: m.totalReturn,
        r: 10,
      },
    ],
    backgroundColor: m.asset.color + 'cc',
    borderColor: m.asset.color,
    borderWidth: 2,
    hoverRadius: 14,
    // Store name for datalabels plugin
    datalabels: {
      labels: {
        name: {
          display: true,
          formatter: () => shortName(m.asset.name),
        },
      },
    },
  }))

  return { datasets }
})

const chartOptions = computed(() => {
  void theme.value

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: cssVar('--chart-tooltip-bg') || '#1e293b',
        titleColor: cssVar('--chart-tooltip-title') || '#e2e8f0',
        bodyColor: cssVar('--chart-tooltip-body') || '#cbd5e1',
        borderColor: cssVar('--chart-tooltip-border') || '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const ds = ctx.dataset
            const point = ctx.raw
            return `${ds.label}: Return ${point.y >= 0 ? '+' : ''}${point.y.toFixed(1)}%, Vol ${point.x.toFixed(1)}%`
          },
        },
      },
      datalabels: {
        color: cssVar('--text') || '#e2e8f0',
        font: {
          family: "'JetBrains Mono', monospace",
          size: 10,
          weight: 'bold' as const,
        },
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 4,
        formatter: (_: any, ctx: any) => {
          return shortName(ctx.dataset.label)
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Volatility (Annualized %)',
          color: cssVar('--text-muted') || '#94a3b8',
          font: {
            family: "'JetBrains Mono', monospace",
            size: 11,
            weight: 'bold' as const,
          },
        },
        ticks: {
          color: cssVar('--chart-tick'),
          font: { size: 11 },
          callback: (val: any) => `${Number(val).toFixed(0)}%`,
        },
        grid: { color: cssVar('--chart-grid') },
      },
      y: {
        title: {
          display: true,
          text: 'Total Return (%)',
          color: cssVar('--text-muted') || '#94a3b8',
          font: {
            family: "'JetBrains Mono', monospace",
            size: 11,
            weight: 'bold' as const,
          },
        },
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

/** Custom plugin to draw quadrant lines through the median */
const quadrantPlugin = {
  id: 'quadrant',
  beforeDraw(chart: any) {
    const { ctx, chartArea, scales } = chart
    if (!chartArea) return

    // Collect all data points
    const xs: number[] = []
    const ys: number[] = []
    for (const ds of chart.data.datasets) {
      for (const pt of ds.data) {
        xs.push(pt.x)
        ys.push(pt.y)
      }
    }
    if (xs.length < 2) return

    // Use median as quadrant center
    xs.sort((a: number, b: number) => a - b)
    ys.sort((a: number, b: number) => a - b)
    const medX = xs[Math.floor(xs.length / 2)]
    const medY = ys[Math.floor(ys.length / 2)]

    const xPixel = scales.x.getPixelForValue(medX)
    const yPixel = scales.y.getPixelForValue(medY)

    ctx.save()
    ctx.strokeStyle = (cssVar('--text-muted') || '#94a3b8') + '33'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])

    // Vertical line
    ctx.beginPath()
    ctx.moveTo(xPixel, chartArea.top)
    ctx.lineTo(xPixel, chartArea.bottom)
    ctx.stroke()

    // Horizontal line
    ctx.beginPath()
    ctx.moveTo(chartArea.left, yPixel)
    ctx.lineTo(chartArea.right, yPixel)
    ctx.stroke()

    ctx.restore()

    // Quadrant labels
    ctx.save()
    ctx.font = "600 9px 'JetBrains Mono', monospace"
    ctx.fillStyle = (cssVar('--text-muted') || '#94a3b8') + '55'
    ctx.textAlign = 'center'

    const pad = 20
    // Top-left: high return, low risk = best
    ctx.fillText('HIGH RETURN', (chartArea.left + xPixel) / 2, chartArea.top + pad)
    ctx.fillText('LOW RISK', (chartArea.left + xPixel) / 2, chartArea.top + pad + 12)

    // Top-right: high return, high risk
    ctx.fillText('HIGH RETURN', (xPixel + chartArea.right) / 2, chartArea.top + pad)
    ctx.fillText('HIGH RISK', (xPixel + chartArea.right) / 2, chartArea.top + pad + 12)

    // Bottom-left: low return, low risk
    ctx.fillText('LOW RETURN', (chartArea.left + xPixel) / 2, chartArea.bottom - pad - 4)
    ctx.fillText('LOW RISK', (chartArea.left + xPixel) / 2, chartArea.bottom - pad + 8)

    // Bottom-right: low return, high risk = worst
    ctx.fillText('LOW RETURN', (xPixel + chartArea.right) / 2, chartArea.bottom - pad - 4)
    ctx.fillText('HIGH RISK', (xPixel + chartArea.right) / 2, chartArea.bottom - pad + 8)

    ctx.restore()
  },
}
</script>

<template>
  <div v-if="store.hasRun && store.metrics.length >= 2" class="scatter-wrap">
    <div class="chart-header">
      <div class="chart-title-area">
        <h2>Risk vs. Return</h2>
        <p class="chart-subtitle">Each bubble plots an asset's volatility against its total return. Top-left is the sweet spot.</p>
      </div>
      <button class="export-btn" @click="downloadPng" title="Download PNG">PNG</button>
    </div>
    <div class="chart-container">
      <Bubble
        ref="chartRef"
        :data="chartData"
        :options="chartOptions"
        :plugins="[quadrantPlugin, ChartDataLabels]"
      />
    </div>
  </div>
</template>

<style scoped>
.scatter-wrap {
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
  height: 340px;
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
