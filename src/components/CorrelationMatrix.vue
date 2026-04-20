<script setup lang="ts">
import { computed } from 'vue'
import { useComparisonStore } from '@/stores/comparison'

const store = useComparisonStore()

/** Pearson correlation between two arrays of equal length */
function pearson(a: number[], b: number[]): number {
  const n = a.length
  if (n < 3) return 0
  const meanA = a.reduce((s, v) => s + v, 0) / n
  const meanB = b.reduce((s, v) => s + v, 0) / n
  let num = 0
  let denA = 0
  let denB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    num += da * db
    denA += da * da
    denB += db * db
  }
  const den = Math.sqrt(denA * denB)
  return den === 0 ? 0 : num / den
}

interface CorrelationEntry {
  assetA: string
  assetB: string
  value: number
}

const matrix = computed(() => {
  const data = store.assetsData
  if (data.length < 2) return { labels: [] as string[], colors: [] as string[], grid: [] as number[][] }

  const labels = data.map((d) => d.asset.name)
  const colors = data.map((d) => d.asset.color)

  // Build date-aligned daily returns for each asset
  // First, build date→price maps
  const dateMaps = data.map((d) => {
    const m = new Map<string, number>()
    for (const p of d.prices) m.set(p.date, p.price)
    return m
  })

  // Find common dates across ALL assets for clean correlation
  const allDateSets = dateMaps.map((m) => new Set(m.keys()))
  let commonDates = [...allDateSets[0]]
  for (let i = 1; i < allDateSets.length; i++) {
    commonDates = commonDates.filter((d) => allDateSets[i].has(d))
  }
  commonDates.sort()

  // Compute daily returns on common dates
  const dailyReturns: number[][] = dateMaps.map((m) => {
    const returns: number[] = []
    for (let i = 1; i < commonDates.length; i++) {
      const prev = m.get(commonDates[i - 1])!
      const curr = m.get(commonDates[i])!
      returns.push(prev > 0 ? (curr - prev) / prev : 0)
    }
    return returns
  })

  // Build correlation grid
  const n = data.length
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    grid[i][i] = 1
    for (let j = i + 1; j < n; j++) {
      const corr = pearson(dailyReturns[i], dailyReturns[j])
      grid[i][j] = corr
      grid[j][i] = corr
    }
  }

  return { labels, colors, grid }
})

/** Map correlation value [-1, 1] to a CSS color.
 *  Uses a dark-to-saturated scheme so text is always readable:
 *  -1 = deep red, 0 = dark slate, +1 = vivid green */
function corrColor(value: number): string {
  const clamped = Math.max(-1, Math.min(1, value))
  if (clamped >= 0) {
    // Dark slate (0) → vivid green (+1)
    const t = clamped
    const r = Math.round(30 + (1 - t) * 20)   // 50 → 30
    const g = Math.round(60 + t * 140)          // 60 → 200
    const b = Math.round(50 + (1 - t) * 20)    // 70 → 50
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Dark slate (0) → deep red (-1)
    const t = -clamped
    const r = Math.round(50 + t * 180)          // 50 → 230
    const g = Math.round(60 - t * 30)           // 60 → 30
    const b = Math.round(70 - t * 30)           // 70 → 40
    return `rgb(${r}, ${g}, ${b})`
  }
}

function corrText(value: number): string {
  if (value === 1) return '1.00'
  return value.toFixed(2)
}

function textColor(_value: number): string {
  return '#e2e8f0'
}

/** Abbreviate long names */
function shortName(name: string): string {
  if (name.length <= 12) return name
  // Show ticker in parens if present, else truncate
  const match = name.match(/\(([^)]+)\)/)
  if (match) return match[1]
  return name.slice(0, 10) + '..'
}
</script>

<template>
  <div v-if="store.hasRun && matrix.labels.length >= 2" class="correlation-wrap">
    <div class="section-header">
      <div class="section-title-area">
        <h2>Correlation Matrix</h2>
        <p class="section-subtitle">Pearson correlation of daily returns between each asset pair.</p>
      </div>
    </div>

    <div class="matrix-scroll">
      <table class="corr-table">
        <thead>
          <tr>
            <th class="corner-cell"></th>
            <th
              v-for="(label, i) in matrix.labels"
              :key="'h-' + i"
              class="col-header"
            >
              <span class="header-dot" :style="{ background: matrix.colors[i] }"></span>
              {{ shortName(label) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in matrix.grid" :key="'r-' + i">
            <td class="row-header">
              <span class="header-dot" :style="{ background: matrix.colors[i] }"></span>
              {{ shortName(matrix.labels[i]) }}
            </td>
            <td
              v-for="(val, j) in row"
              :key="'c-' + j"
              class="corr-cell"
              :style="{
                background: corrColor(val),
                color: textColor(val),
              }"
              :title="`${matrix.labels[i]} vs ${matrix.labels[j]}: ${val.toFixed(4)}`"
            >
              {{ corrText(val) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="legend">
      <span class="legend-label">-1.0</span>
      <div class="legend-bar"></div>
      <span class="legend-label">+1.0</span>
    </div>
  </div>
</template>

<style scoped>
.correlation-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-title-area {
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

.section-subtitle {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.matrix-scroll {
  overflow-x: auto;
  background: var(--card-inner-bg, var(--bg));
  border-radius: 8px;
  padding: 0.75rem;
}

.corr-table {
  border-collapse: separate;
  border-spacing: 3px;
  margin: 0 auto;
}

.corner-cell {
  min-width: 30px;
}

.col-header {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  padding: 0.4rem 0.3rem;
  text-align: center;
  white-space: nowrap;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  height: 80px;
  vertical-align: bottom;
}

.row-header {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  padding: 0.3rem 0.5rem;
  text-align: right;
  white-space: nowrap;
}

.header-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 0.25rem;
  vertical-align: middle;
  flex-shrink: 0;
}

.corr-cell {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  padding: 0.5rem 0.4rem;
  border-radius: 4px;
  min-width: 48px;
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: default;
}

.corr-cell:hover {
  transform: scale(1.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  z-index: 2;
  position: relative;
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  padding-top: 0.25rem;
}

.legend-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 600;
}

.legend-bar {
  width: 160px;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    rgb(230, 30, 40) 0%,
    rgb(50, 60, 70) 50%,
    rgb(30, 200, 50) 100%
  );
}

@media (max-width: 600px) {
  .col-header {
    font-size: 0.55rem;
    height: 60px;
  }
  .row-header {
    font-size: 0.55rem;
  }
  .corr-cell {
    font-size: 0.62rem;
    min-width: 38px;
    padding: 0.35rem 0.25rem;
  }
}
</style>
