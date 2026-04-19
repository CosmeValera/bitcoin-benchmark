<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import { useExport } from '@/composables/useExport'
import type { PerformanceMetrics } from '@/types'

const store = useComparisonStore()
const { exportCsv } = useExport()

type SortKey = 'name' | 'totalReturn' | 'startPrice' | 'currentPrice' | 'high' | 'low' | 'volatility'

const sortKey = ref<SortKey | null>(null)
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'name' ? 'asc' : 'desc'
  }
}

function sortArrow(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' \u25B2' : ' \u25BC'
}

const sortedMetrics = computed(() => {
  const list = [...store.metrics]
  if (!sortKey.value) return list
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return list.sort((a, b) => {
    const va = key === 'name' ? a.asset.name : a[key as keyof PerformanceMetrics] as number
    const vb = key === 'name' ? b.asset.name : b[key as keyof PerformanceMetrics] as number
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * dir
    return ((va as number) - (vb as number)) * dir
  })
})

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtCurrency(n: number, date?: string): string {
  const converted = store.convertPrice(n, date)
  const sym = store.currencySymbol()
  if (store.displayCurrency === 'BTC') return sym + converted.toFixed(6)
  if (store.displayCurrency === 'sats') return fmt(Math.round(converted), 0) + ' sats'
  return sym + fmt(converted, 2)
}

const showHoldings = computed(() =>
  store.metrics.some((m) => m.asset.btcHoldings != null),
)

const showDividend = computed(() =>
  store.metrics.some((m) => m.asset.dividendRate != null),
)

function divYield(m: PerformanceMetrics): string {
  const { dividendRate, parValue } = m.asset
  if (dividendRate == null || parValue == null || m.currentPrice <= 0) return '\u2014'
  return fmt((dividendRate * parValue / m.currentPrice) * 100, 1) + '%'
}

function fmtHoldings(n: number | undefined): string {
  if (n == null) return '\u2014'
  return n.toLocaleString('en-US')
}
</script>

<template>
  <div v-if="store.hasRun && store.metrics.length" class="perf-table">
    <div class="table-header">
      <div class="table-title-area">
        <h2>Performance Metrics</h2>
        <p class="table-subtitle">Sortable breakdown of each selected asset.</p>
      </div>
      <button class="export-btn" @click="exportCsv(store.metrics)" title="Download CSV">CSV</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="col-asset sortable" @click="toggleSort('name')">Asset{{ sortArrow('name') }}</th>
            <th class="col-num sortable" @click="toggleSort('totalReturn')">Return{{ sortArrow('totalReturn') }}</th>
            <th class="col-num sortable" @click="toggleSort('startPrice')">Start Price{{ sortArrow('startPrice') }}</th>
            <th class="col-num sortable" @click="toggleSort('currentPrice')">Current Price{{ sortArrow('currentPrice') }}</th>
            <th class="col-num sortable" @click="toggleSort('high')">High{{ sortArrow('high') }}</th>
            <th class="col-num sortable" @click="toggleSort('low')">Low{{ sortArrow('low') }}</th>
            <th class="col-num sortable" @click="toggleSort('volatility')">Volatility{{ sortArrow('volatility') }}</th>
            <th v-if="showHoldings" class="col-num">BTC Holdings</th>
            <th v-if="showDividend" class="col-num">Div. Yield</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in sortedMetrics" :key="m.asset.id">
            <td class="col-asset">
              <span class="dot" :style="{ background: m.asset.color }"></span>
              {{ m.asset.name }}
            </td>
            <td
              class="col-num"
              :class="{ positive: m.totalReturn >= 0, negative: m.totalReturn < 0 }"
            >
              {{ m.totalReturn >= 0 ? '+' : '' }}{{ fmt(m.totalReturn, 1) }}%
            </td>
            <td class="col-num">{{ fmtCurrency(m.startPrice) }}</td>
            <td class="col-num">{{ fmtCurrency(m.currentPrice) }}</td>
            <td class="col-num">{{ fmtCurrency(m.high) }}</td>
            <td class="col-num">{{ fmtCurrency(m.low) }}</td>
            <td class="col-num">{{ fmt(m.volatility, 1) }}%</td>
            <td v-if="showHoldings" class="col-num">{{ fmtHoldings(m.asset.btcHoldings) }}</td>
            <td v-if="showDividend" class="col-num">{{ divYield(m) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.errors.size > 0" class="errors">
      <p v-for="[id, msg] in store.errors" :key="id" class="error-line">{{ msg }}</p>
    </div>
  </div>
</template>

<style scoped>
.perf-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.table-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.table-title-area {
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

.table-subtitle {
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

.table-wrap {
  overflow-x: auto;
  background: var(--card-inner-bg, var(--bg));
  border-radius: 8px;
  padding: 0.25rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th {
  font-family: 'JetBrains Mono', monospace;
  text-align: left;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  color: var(--text);
}

td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--td-border);
  white-space: nowrap;
}

tr:last-child td {
  border-bottom: none;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-asset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}

.errors {
  margin-top: 0.25rem;
}

.error-line {
  font-size: 0.8rem;
  color: var(--warning);
  margin: 0.25rem 0;
}

@media (max-width: 600px) {
  table {
    font-size: 0.78rem;
  }

  th,
  td {
    padding: 0.4rem 0.5rem;
  }
}
</style>
