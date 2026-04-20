<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { ASSETS, ASSET_CATEGORIES } from '@/types'
import { useTickerSearch } from '@/composables/useTickerSearch'

const store = usePortfolioStore()
const { suggestions, searching, search, clear, validateTicker } = useTickerSearch()

const presets: { label: string; weights: Record<string, number> }[] = [
  { label: '100% BTC', weights: { btc: 100 } },
  { label: '60/40 BTC SPY', weights: { btc: 60, spy: 40 } },
  { label: 'BTC + MSTR', weights: { btc: 50, mstr: 50 } },
  { label: 'Treasury Mix', weights: { btc: 40, mstr: 30, metaplanet: 15, xxi: 15 } },
]

const tickerInput = ref('')
const addError = ref('')
const validating = ref(false)
const showDropdown = ref(false)

function onInput(id: string, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value) || 0
  store.setWeight(id, val)
}

function assetsForCategory(key: string) {
  return ASSETS.filter((a) => a.category === key)
}

watch(tickerInput, (val) => {
  addError.value = ''
  if (val.trim().length > 0) {
    showDropdown.value = true
    search(val)
  } else {
    showDropdown.value = false
    clear()
  }
})

async function addTickerWithValidation(ticker: string) {
  addError.value = ''
  const normalized = ticker.trim().toUpperCase()
  if (!normalized) return

  // Check if already exists
  if (ASSETS.some((a) => a.ticker.toUpperCase() === normalized)) {
    addError.value = `"${normalized}" is already a built-in asset`
    return
  }
  if (store.customAssets.some((a) => a.ticker.toUpperCase() === normalized)) {
    addError.value = `"${normalized}" already added`
    return
  }

  validating.value = true
  showDropdown.value = false
  clear()

  const valid = await validateTicker(normalized)
  validating.value = false

  if (!valid) {
    addError.value = `"${normalized}" not found, check the ticker symbol`
    return
  }

  const ok = store.addCustomAsset(normalized)
  if (ok) {
    tickerInput.value = ''
  } else {
    addError.value = `"${normalized}" already exists`
  }
}

function selectSuggestion(symbol: string) {
  tickerInput.value = symbol
  showDropdown.value = false
  clear()
  addTickerWithValidation(symbol)
}

function onTickerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    showDropdown.value = false
    clear()
    addTickerWithValidation(tickerInput.value)
  }
  if (e.key === 'Escape') {
    showDropdown.value = false
    clear()
  }
}

function onTickerBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Short display names for compact grid
function shortName(name: string): string {
  const match = name.match(/\(([^)]+)\)/)
  if (match) return name.replace(/\s*\([^)]+\)/, '')
  return name
}

function tickerBadge(name: string): string {
  const match = name.match(/\(([^)]+)\)/)
  return match ? match[1] : ''
}

// Active asset count
const activeCount = computed(() => {
  return store.allAssets.filter((a) => (store.allocations[a.id] ?? 0) > 0).length
})

// Normalized percentages (always sum to 100% when any asset is active)
const normalizedPct = computed(() => {
  const total = store.totalWeight
  const result: Record<string, number> = {}
  for (const a of store.allAssets) {
    const raw = store.allocations[a.id] ?? 0
    result[a.id] = total > 0 ? (raw / total) * 100 : 0
  }
  return result
})

// Donut chart data
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

  let offset = 0
  return active.map((s) => {
    const slice = { ...s, offset }
    offset += s.pct
    return slice
  })
})

const R = 15.9155
const CIRC = 2 * Math.PI * R
</script>

<template>
  <section class="weights-panel">
    <div class="weights-header">
      <div class="weights-title-area">
        <h2>Asset Allocation</h2>
        <p class="weights-subtitle">Distribute weight across Bitcoin, treasuries, preferreds and indices.</p>
      </div>
      <div class="donut-area">
        <div class="donut-breakdown" v-if="donutSlices.length > 0">
          <div v-for="slice in donutSlices" :key="slice.id" class="breakdown-item">
            <span class="breakdown-dot" :style="{ background: slice.color }"></span>
            <span class="breakdown-name">{{ shortName(slice.name) }}</span>
            <span class="breakdown-pct">{{ Math.round(slice.pct) }}%</span>
          </div>
        </div>
        <div class="donut-wrap">
          <svg class="donut" viewBox="0 0 42 42" v-if="store.totalWeight > 0">
            <circle class="donut-track" cx="21" cy="21" :r="R" fill="none" stroke-width="3" />
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
              {{ activeCount }}
            </text>
          </svg>
          <svg class="donut" viewBox="0 0 42 42" v-else>
            <circle class="donut-track" cx="21" cy="21" :r="R" fill="none" stroke-width="3" />
            <text x="21" y="21.5" text-anchor="middle" dominant-baseline="middle" class="donut-label">0</text>
          </svg>
          <span class="donut-count">ASSETS</span>
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

    <!-- Built-in assets — compact 2-col grid -->
    <div v-for="cat in ASSET_CATEGORIES" :key="cat.key" class="category">
      <h3>{{ cat.label }}</h3>
      <div class="asset-grid">
        <div
          v-for="asset in assetsForCategory(cat.key)"
          :key="asset.id"
          class="asset-cell"
          :class="{ active: (store.allocations[asset.id] ?? 0) > 0 }"
          :title="asset.description"
        >
          <div class="cell-top">
            <span class="dot" :style="{ background: asset.color }"></span>
            <span class="cell-name">{{ shortName(asset.name) }}</span>
            <span v-if="tickerBadge(asset.name) || asset.ticker !== asset.name" class="ticker-badge">{{ tickerBadge(asset.name) || asset.ticker }}</span>
            <span class="cell-value" :class="{ highlight: (store.allocations[asset.id] ?? 0) > 0 }">
              {{ Math.round(normalizedPct[asset.id] ?? 0) }}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            class="cell-slider"
            :style="{ background: `linear-gradient(to right, ${asset.color} ${store.allocations[asset.id] ?? 0}%, #94a3b8 ${store.allocations[asset.id] ?? 0}%)`, '--thumb-color': asset.color } as any"
            :value="store.allocations[asset.id]"
            @input="onInput(asset.id, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Custom Tickers -->
    <div class="category">
      <h3>Custom Tickers</h3>
      <div class="add-ticker-row">
        <div class="add-ticker-input-wrap">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z" clip-rule="evenodd" />
          </svg>
          <input
            type="text"
            v-model="tickerInput"
            placeholder="AAPL, ETH-USD, NVDA..."
            class="ticker-field"
            @keydown="onTickerKeydown"
            @blur="onTickerBlur"
            @focus="tickerInput.trim() && (showDropdown = true)"
            autocomplete="off"
          />
          <!-- Autocomplete dropdown -->
          <div v-if="showDropdown && (suggestions.length > 0 || searching)" class="autocomplete-dropdown">
            <div v-if="searching && suggestions.length === 0" class="autocomplete-loading">
              Searching...
            </div>
            <button
              v-for="s in suggestions"
              :key="s.symbol"
              class="autocomplete-item"
              @mousedown.prevent="selectSuggestion(s.symbol)"
            >
              <span class="ac-symbol">{{ s.symbol }}</span>
              <span class="ac-name">{{ s.name }}</span>
              <span class="ac-type">{{ s.type }}</span>
            </button>
          </div>
        </div>
        <button
          class="add-btn"
          @click="addTickerWithValidation(tickerInput)"
          :disabled="!tickerInput.trim() || validating"
        >
          <template v-if="validating">
            <span class="mini-spinner"></span>
          </template>
          <template v-else>
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add
          </template>
        </button>
      </div>
      <span v-if="addError" class="add-error">{{ addError }}</span>

      <div v-if="store.customAssets.length > 0" class="asset-grid" style="margin-top: 0.4rem;">
        <div
          v-for="asset in store.customAssets"
          :key="asset.id"
          class="asset-cell custom-cell"
          :class="{ active: (store.allocations[asset.id] ?? 0) > 0 }"
          :title="asset.description"
        >
          <div class="cell-top">
            <span class="dot" :style="{ background: asset.color }"></span>
            <span class="cell-name">{{ asset.name }}</span>
            <span class="cell-value" :class="{ highlight: (store.allocations[asset.id] ?? 0) > 0 }">
              {{ Math.round(normalizedPct[asset.id] ?? 0) }}%
            </span>
            <button class="remove-btn" @click="store.removeCustomAsset(asset.id)" title="Remove">
              <svg viewBox="0 0 20 20" fill="currentColor" width="10" height="10">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            class="cell-slider"
            :style="{ background: `linear-gradient(to right, ${asset.color} ${store.allocations[asset.id] ?? 0}%, #94a3b8 ${store.allocations[asset.id] ?? 0}%)`, '--thumb-color': asset.color } as any"
            :value="store.allocations[asset.id] ?? 0"
            @input="onInput(asset.id, $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.weights-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.weights-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.weights-title-area {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.weights-subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Donut */
.donut-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.donut-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  white-space: nowrap;
}

.breakdown-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.breakdown-name {
  color: var(--text-muted);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.breakdown-pct {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  font-size: 0.65rem;
  margin-left: auto;
}

.donut-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.donut {
  width: 56px;
  height: 56px;
  transform: rotate(-90deg);
}

.donut-track {
  stroke: var(--border);
}

.donut-label {
  fill: var(--text);
  font-size: 10px;
  font-weight: 700;
  transform: rotate(90deg);
  transform-origin: 21px 21px;
}

.donut-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

/* Presets */
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

/* Custom tickers */
.add-ticker-row {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}

.add-ticker-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.5rem;
  color: var(--text-muted);
  pointer-events: none;
  opacity: 0.5;
  z-index: 1;
}

.ticker-field {
  width: 100%;
  padding: 0.35rem 0.5rem 0.35rem 1.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card-inner-bg);
  color: var(--text);
  font-size: 0.78rem;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  transition: border-color 0.15s;
}

.ticker-field::placeholder {
  text-transform: none;
  color: var(--text-muted);
  opacity: 0.6;
  font-family: 'Inter', sans-serif;
}

.ticker-field:focus {
  outline: none;
  border-color: var(--accent);
}

/* Autocomplete dropdown */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 50;
  max-height: 240px;
  overflow-y: auto;
}

.autocomplete-loading {
  padding: 0.6rem 0.75rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.autocomplete-item:hover {
  background: var(--card-inner-bg);
}

.autocomplete-item:not(:last-child) {
  border-bottom: 1px solid var(--td-border);
}

.ac-symbol {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--accent);
  min-width: 65px;
}

.ac-name {
  flex: 1;
  font-size: 0.72rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ac-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-muted);
  opacity: 0.6;
  text-transform: uppercase;
  flex-shrink: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 0.78rem;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.add-error {
  font-size: 0.7rem;
  color: var(--red);
  display: block;
  margin-top: 0.2rem;
}

.custom-cell .cell-top {
  gap: 0.25rem;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  opacity: 0.3;
  transition: all 0.15s;
}

.remove-btn:hover {
  opacity: 1;
  color: var(--red);
}

/* Asset categories */
h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 0.35rem;
}

.category {
  margin-top: 0;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Ticker badge */
.ticker-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--card-inner-bg, var(--bg));
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  line-height: 1.3;
}

/* 2-column compact grid */
.asset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem;
}

.asset-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.15s;
  cursor: default;
}

.asset-cell.active {
  background: var(--card-inner-bg, var(--bg));
  border-color: var(--border);
}

.cell-top {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.cell-name {
  font-size: 0.78rem;
  font-weight: 600;
  flex: 1;
}

.cell-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  min-width: 26px;
  text-align: right;
}

.cell-value.highlight {
  color: var(--accent);
  font-weight: 700;
}

/* Colored range slider */
.cell-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 5px;
  border-radius: 3px;
  cursor: pointer;
  outline: none;
}
.cell-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--thumb-color, var(--accent));
  box-shadow: 0 0 2px rgba(0,0,0,.4);
}
.cell-slider::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--thumb-color, var(--accent));
  border: none;
  box-shadow: 0 0 2px rgba(0,0,0,.4);
}

@media (max-width: 500px) {
  .weights-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  .donut-area {
    align-self: flex-end;
  }
}

@media (max-width: 400px) {
  .asset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
