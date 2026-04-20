<script setup lang="ts">
import { computed } from 'vue'
import { useProjectionStore } from '@/stores/projection'

const store = useProjectionStore()

const cards = computed(() => {
  const r = store.result
  if (!r) return []
  return [
    {
      label: 'Final Value',
      value: store.formatCurrency(r.finalValue),
      sub: `After ${store.investmentYears} years`,
      positive: true,
      negative: false,
    },
    {
      label: 'Total Contributed',
      value: store.formatCurrency(r.totalContributed),
      sub: `$${store.initialInvestment.toLocaleString()} + $${store.monthlyContribution.toLocaleString()}/mo`,
      positive: false,
      negative: false,
    },
    {
      label: 'Interest Earned',
      value: store.formatCurrency(r.totalInterestEarned),
      sub: 'Compound growth',
      positive: true,
      negative: false,
    },
    {
      label: 'Effective Growth',
      value: `+${r.effectiveGrowth.toFixed(1)}%`,
      sub: `At ${store.annualReturn}% annual return`,
      positive: true,
      negative: false,
    },
  ]
})
</script>

<template>
  <div v-if="store.hasRun && store.result" class="results-summary">
    <div class="strategy-section">
      <h3>Projection Results</h3>
      <div class="cards-grid">
        <div
          v-for="card in cards"
          :key="card.label"
          class="card"
        >
          <span class="card-label">{{ card.label }}</span>
          <span class="card-value" :class="{ positive: card.positive, negative: card.negative }">{{ card.value }}</span>
          <span class="card-sub">{{ card.sub }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-summary {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.strategy-section h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0 0 0.5rem;
}

.cards-grid {
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
  font-size: 1.1rem;
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
