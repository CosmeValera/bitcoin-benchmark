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

const cards = computed(() => {
  const r = store.result
  if (!r) return []
  return [
    {
      label: 'Total Return',
      value: `${r.totalReturn >= 0 ? '+' : ''}${fmt(r.totalReturn)}%`,
      positive: r.totalReturn >= 0,
      negative: r.totalReturn < 0,
    },
    {
      label: 'Volatility (Ann.)',
      value: `${fmt(r.volatility)}%`,
      positive: false,
      negative: false,
    },
    {
      label: 'Max Drawdown',
      value: `${fmt(r.maxDrawdown)}%`,
      positive: false,
      negative: r.maxDrawdown > 0,
    },
    {
      label: 'Assets in Portfolio',
      value: `${r.assetData.length}`,
      positive: false,
      negative: false,
    },
  ]
})
</script>

<template>
  <section v-if="store.hasRun && store.result" class="portfolio-summary">
    <h2>Portfolio Summary</h2>
    <div class="cards-grid">
      <div
        v-for="card in cards"
        :key="card.label"
        class="card"
        :class="{ positive: card.positive, negative: card.negative }"
      >
        <span class="card-label">{{ card.label }}</span>
        <span class="card-value">{{ card.value }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.portfolio-summary {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
}

h2 {
  margin: 0 0 1.25rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.card {
  background: var(--card-inner-bg);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.card-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
}

.card-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.card.positive .card-value {
  color: var(--green);
}

.card.negative .card-value {
  color: var(--red);
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
