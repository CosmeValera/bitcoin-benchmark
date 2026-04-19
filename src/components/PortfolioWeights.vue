<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { ASSETS, ASSET_CATEGORIES } from '@/types'

const store = usePortfolioStore()

const presets: { label: string; weights: Record<string, number> }[] = [
  { label: '100% BTC', weights: { btc: 100 } },
  { label: '60/40 BTC/SPY', weights: { btc: 60, spy: 40 } },
  { label: 'BTC + MSTR', weights: { btc: 50, mstr: 50 } },
  { label: 'Treasury Mix', weights: { btc: 40, mstr: 30, metaplanet: 15, xxi: 15 } },
]

const tickerInput = ref('')
const addError = ref('')

function onInput(id: string, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value) || 0
  store.setWeight(id, val)
}

function assetsForCategory(key: string) {
  return ASSETS.filter((a) => a.category === key)
}

function addTicker() {
  addError.value = ''
  const ticker = tickerInput.value.trim()
  if (!ticker) return
  const ok = store.addCustomAsset(ticker)
  if (ok) {
    tickerInput.value = ''
  } else {
    addError.value = `"${ticker.toUpperCase()}" already exists`
  }
}

function onTickerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') addTicker()
}

// Donut chart data: active assets normalized to 100%
const donutSlices = computed(() => {
  const total = store.totalWeight
  if (total <= 0) return []

  const all = store.allAssets
  const active = all
    .filter((a) => (store.allocations[a.id] ?? 0) > 0)
    .map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color,
      raw: store.allocations[a.id],
      pct: (store.allocations[a.id] / total) * 100,
    }))

  // Build SVG arc offsets
  let offset = 0
  return active.map((s) => {
    const slice = { ...s, offset }
    offset += s.pct
    return slice
  })
})

// SVG donut helpers (radius 15.9155 gives circumference ~ 100)
const R = 15.9155
const CIRC = 2 * Math.PI * R
</script>

<template>
  <section class="weights-panel">
    <div class="weights-header">
      <h2>Asset Allocation</h2>
      <div class="donut-area">
        <svg class="donut" viewBox="0 0 42 42" v-if="store.totalWeight > 0">
          <circle class="donut-bg" cx="21" cy="21" :r="R" fill="none" stroke-width="4" />
          <circle
            v-for="slice in donutSlices"
            :key="slice.id"
            cx="21" cy="21" :r="R"
            fill="none"
            :stroke="slice.color"
            stroke-width="4"
            :stroke-dasharray="`${(slice.pct / 100) * CIRC} ${CIRC}`"
            :stroke-dashoffset="`${-(slice.offset / 100) * CIRC}`"
            stroke-linecap="butt"
          />
          <text x="21" y="21.5" text-anchor="middle" dominant-baseline="middle" class="donut-label">
            {{ donutSlices.length }}
          </text>
        </svg>
        <svg class="donut" viewBox="0 0 42 42" v-else>
          <circle class="donut-bg" cx="21" cy="21" :r="R" fill="none" stroke-width="4" />
          <text x="21" y="21.5" text-anchor="middle" dominant-baseline="middle" class="donut-label">0</text>
        </svg>
        <div class="donut-legend" v-if="donutSlices.length > 0">
          <span v-for="slice in donutSlices" :key="slice.id" class="legend-item">
            <span class="legend-dot" :style="{ background: slice.color }"></span>
            <span class="legend-text">{{ slice.pct.toFixed(0) }}%</span>
          </span>
        </div>
      </div>
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

    <!-- Custom Assets -->
    <div class="category">
      <h3>Custom Tickers</h3>
      <div class="add-ticker">
        <input
          type="text"
          v-model="tickerInput"
          placeholder="e.g. ETH, AAPL, GLD..."
          class="ticker-field"
          @keydown="onTickerKeydown"
        />
        <button class="add-btn" @click="addTicker" :disabled="!tickerInput.trim()">Add</button>
      </div>
      <span v-if="addError" class="add-error">{{ addError }}</span>

      <div class="asset-rows" v-if="store.customAssets.length > 0">
        <div v-for="asset in store.customAssets" :key="asset.id" class="asset-row">
          <div class="asset-info">
            <span class="dot" :style="{ background: asset.color }"></span>
            <span class="asset-name">{{ asset.name }}</span>
            <button class="remove-btn" @click="store.removeCustomAsset(asset.id)" title="Remove">&times;</button>
          </div>
          <div class="weight-input">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              :value="store.allocations[asset.id] ?? 0"
              @input="onInput(asset.id, $event)"
            />
            <span class="weight-value">{{ store.allocations[asset.id] ?? 0 }}%</span>
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

.donut-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.donut {
  width: 48px;
  height: 48px;
  transform: rotate(-90deg);
}

.donut-bg {
  stroke: var(--border);
}

.donut-label {
  fill: var(--text);
  font-size: 10px;
  font-weight: 700;
  transform: rotate(90deg);
  transform-origin: 21px 21px;
}

.donut-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.45rem;
  max-width: 140px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-text {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
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

.add-ticker {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.ticker-field {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--input-bg, var(--card-bg));
  color: var(--text);
  font-size: 0.8rem;
  font-family: inherit;
  text-transform: uppercase;
}

.ticker-field::placeholder {
  text-transform: none;
  color: var(--text-muted);
}

.ticker-field:focus {
  outline: none;
  border-color: var(--accent);
}

.add-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 0.8rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.add-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.add-error {
  font-size: 0.7rem;
  color: var(--red, #ef4444);
  display: block;
  margin-bottom: 0.35rem;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.15rem;
  opacity: 0.5;
  transition: opacity 0.15s, color 0.15s;
}

.remove-btn:hover {
  opacity: 1;
  color: var(--red, #ef4444);
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
