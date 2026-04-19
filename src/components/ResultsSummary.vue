<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'

const store = useSimulationStore()

const dcaCards = computed(() => {
  const r = store.result
  if (!r) return []
  return [
    {
      label: 'Total Invested',
      value: store.formatCurrency(r.dcaTotalInvested[r.dcaTotalInvested.length - 1]),
      sub: 'DCA strategy',
      positive: false,
      negative: false,
    },
    {
      label: 'Portfolio Value',
      value: store.formatCurrency(r.dcaFinalValue),
      sub: 'Current worth',
      positive: true,
      negative: false,
    },
    {
      label: 'ROI',
      value: `${r.dcaROI >= 0 ? '+' : ''}${r.dcaROI.toFixed(1)}%`,
      sub: 'Return on investment',
      positive: r.dcaROI >= 0,
      negative: r.dcaROI < 0,
    },
    {
      label: 'BTC Accumulated',
      value: `₿ ${store.formatBtc(r.dcaBtcAccumulated)}`,
      sub: 'Total holdings',
      positive: false,
      negative: false,
    },
  ]
})

const lumpCards = computed(() => {
  const r = store.result
  if (!r) return []
  return [
    {
      label: 'Total Invested',
      value: store.formatCurrency(r.lumpSumTotalInvested),
      sub: 'Lump sum',
      positive: false,
      negative: false,
    },
    {
      label: 'Portfolio Value',
      value: store.formatCurrency(r.lumpSumFinalValue),
      sub: 'Current worth',
      positive: true,
      negative: false,
    },
    {
      label: 'ROI',
      value: `${r.lumpSumROI >= 0 ? '+' : ''}${r.lumpSumROI.toFixed(1)}%`,
      sub: 'Return on investment',
      positive: r.lumpSumROI >= 0,
      negative: r.lumpSumROI < 0,
    },
    {
      label: 'BTC Accumulated',
      value: `₿ ${store.formatBtc(r.lumpSumBtcAccumulated)}`,
      sub: 'Total holdings',
      positive: false,
      negative: false,
    },
  ]
})
</script>

<template>
  <div v-if="store.hasRun && store.result" class="results-summary">
    <div class="strategy-section">
      <h3>DCA Strategy</h3>
      <div class="cards-grid">
        <div
          v-for="card in dcaCards"
          :key="card.label"
          class="card"
        >
          <span class="card-label">{{ card.label }}</span>
          <span class="card-value" :class="{ positive: card.positive, negative: card.negative }">{{ card.value }}</span>
          <span class="card-sub">{{ card.sub }}</span>
        </div>
      </div>
    </div>

    <div class="strategy-section">
      <h3>Lump Sum Strategy</h3>
      <div class="cards-grid">
        <div
          v-for="card in lumpCards"
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
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.card-value {
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
