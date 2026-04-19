<script setup lang="ts">
import { computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'

const store = usePortfolioStore()

function fmt(n: number, decimals = 1): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatDrawdownDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const cards = computed(() => {
  const r = store.result
  if (!r) return []
  return [
    {
      label: 'Total Return',
      value: `${r.totalReturn >= 0 ? '+' : ''}${fmt(r.totalReturn)}%`,
      sub: `vs benchmark`,
      positive: r.totalReturn >= 0,
      negative: r.totalReturn < 0,
    },
    {
      label: 'Volatility (Ann.)',
      value: `${fmt(r.volatility)}%`,
      sub: '252d rolling',
      positive: false,
      negative: false,
    },
    {
      label: 'Max Drawdown',
      value: `${r.maxDrawdown > 0 ? '-' : ''}${fmt(r.maxDrawdown)}%`,
      sub: formatDrawdownDate(r.maxDrawdownDate),
      positive: false,
      negative: r.maxDrawdown > 0,
    },
    {
      label: 'Sharpe Ratio',
      value: `${fmt(r.sharpeRatio, 2)}`,
      sub: 'Risk-adjusted',
      positive: r.sharpeRatio > 0,
      negative: r.sharpeRatio < 0,
    },
  ]
})
</script>

<template>
  <div v-if="store.hasRun && store.result" class="summary-cards">
    <div
      v-for="card in cards"
      :key="card.label"
      class="card"
    >
      <span class="card-label">{{ card.label }}</span>
      <span class="card-value" :class="{ positive: card.positive, negative: card.negative }">{{ card.value }}</span>
      <span v-if="card.sub" class="card-sub">{{ card.sub }}</span>
    </div>
  </div>
</template>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.card {
  background: var(--card-inner-bg, var(--bg));
  border-radius: 8px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.card-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.card-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.card-value.positive {
  color: var(--green);
}

.card-value.negative {
  color: var(--red);
}

.card-sub {
  font-size: 0.65rem;
  color: var(--text-muted);
  opacity: 0.7;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
