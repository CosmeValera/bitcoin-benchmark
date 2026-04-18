<script setup lang="ts">
import { usePortfolioStore } from '@/stores/portfolio'
import { ASSETS, ASSET_CATEGORIES } from '@/types'

const store = usePortfolioStore()

const presets: { label: string; weights: Record<string, number> }[] = [
  { label: '100% BTC', weights: { btc: 100 } },
  { label: '60/40 BTC/SPY', weights: { btc: 60, spy: 40 } },
  { label: 'BTC + MSTR', weights: { btc: 50, mstr: 50 } },
  { label: 'Treasury Mix', weights: { btc: 40, mstr: 30, metaplanet: 15, xxi: 15 } },
]

function onInput(id: string, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value) || 0
  store.setWeight(id, val)
}

function assetsForCategory(key: string) {
  return ASSETS.filter((a) => a.category === key)
}
</script>

<template>
  <section class="weights-panel">
    <div class="weights-header">
      <h2>Asset Allocation</h2>
      <span class="weight-total" :class="{ active: store.totalWeight > 0 }">
        Total: {{ store.totalWeight.toFixed(0) }}%
      </span>
    </div>

    <div class="presets">
      <button
        v-for="p in presets"
        :key="p.label"
        class="preset-btn"
        @click="store.applyPreset(p.weights)"
      >
        {{ p.label }}
      </button>
    </div>

    <div v-for="cat in ASSET_CATEGORIES" :key="cat.key" class="category">
      <h3>{{ cat.label }}</h3>
      <div class="asset-rows">
        <div v-for="asset in assetsForCategory(cat.key)" :key="asset.id" class="asset-row">
          <div class="asset-info">
            <span class="dot" :style="{ background: asset.color }"></span>
            <span class="asset-name">{{ asset.name }}</span>
          </div>
          <div class="weight-input">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              :value="store.allocations[asset.id]"
              @input="onInput(asset.id, $event)"
            />
            <span class="weight-value">{{ store.allocations[asset.id] }}%</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.weights-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.weights-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.weight-total {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.weight-total.active {
  color: var(--text);
  border-color: var(--accent);
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.preset-btn {
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

h3 {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0 0 0.4rem;
}

.category {
  margin-top: 0.25rem;
}

.asset-rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.asset-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 140px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.asset-name {
  font-size: 0.8rem;
  font-weight: 500;
}

.weight-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 260px;
}

.weight-input input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
}

.weight-value {
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
  color: var(--text-muted);
}

@media (max-width: 500px) {
  .asset-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .weight-input {
    max-width: 100%;
    width: 100%;
  }
}
</style>
