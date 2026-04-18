<script setup lang="ts">
import { useComparisonStore } from '@/stores/comparison'

const store = useComparisonStore()

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtCurrency(n: number): string {
  if (n >= 1000) {
    return '$' + fmt(n, 2)
  }
  return '$' + fmt(n, 2)
}
</script>

<template>
  <section v-if="store.hasRun && store.metrics.length" class="perf-table">
    <h2>Performance Metrics</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="col-asset">Asset</th>
            <th class="col-num">Return</th>
            <th class="col-num">Start Price</th>
            <th class="col-num">Current Price</th>
            <th class="col-num">High</th>
            <th class="col-num">Low</th>
            <th class="col-num">Volatility</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in store.metrics" :key="m.asset.id">
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
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.errors.size > 0" class="errors">
      <p v-for="[id, msg] in store.errors" :key="id" class="error-line">{{ msg }}</p>
    </div>
  </section>
</template>

<style scoped>
.perf-table {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  white-space: nowrap;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-asset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
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
  color: #ef4444;
}

.errors {
  margin-top: 0.75rem;
}

.error-line {
  font-size: 0.8rem;
  color: #f59e0b;
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
