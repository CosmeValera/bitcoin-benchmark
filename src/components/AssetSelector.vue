<script setup lang="ts">
import { ref } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import { ASSETS, ASSET_CATEGORIES } from '@/types'

const store = useComparisonStore()

const tickerInput = ref('')
const addError = ref('')

function assetsForCategory(key: string) {
  return ASSETS.filter((a) => a.category === key)
}

function selectAll(key: string) {
  assetsForCategory(key).forEach((a) => {
    if (!store.selectedIds.has(a.id)) store.toggleAsset(a.id)
  })
}

function deselectAll(key: string) {
  assetsForCategory(key).forEach((a) => {
    if (store.selectedIds.has(a.id)) store.toggleAsset(a.id)
  })
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
</script>

<template>
  <section class="asset-selector">
    <div v-for="cat in ASSET_CATEGORIES" :key="cat.key" class="category">
      <div class="category-header">
        <h3>{{ cat.label }}</h3>
        <div class="category-actions">
          <button class="link-btn" @click="selectAll(cat.key)">All</button>
          <button class="link-btn" @click="deselectAll(cat.key)">None</button>
        </div>
      </div>
      <div class="chips">
        <button
          v-for="asset in assetsForCategory(cat.key)"
          :key="asset.id"
          class="chip"
          :class="{ active: store.selectedIds.has(asset.id) }"
          :style="store.selectedIds.has(asset.id) ? { '--chip-color': asset.color } : {}"
          :title="asset.description"
          @click="store.toggleAsset(asset.id)"
        >
          <span class="chip-dot" :style="{ background: asset.color }"></span>
          {{ asset.name }}
        </button>
      </div>
    </div>

    <!-- Custom Tickers -->
    <div class="category">
      <div class="category-header">
        <h3>Custom Tickers</h3>
      </div>
      <div class="custom-section">
        <div class="chips" v-if="store.customAssets.length > 0">
          <button
            v-for="asset in store.customAssets"
            :key="asset.id"
            class="chip"
            :class="{ active: store.selectedIds.has(asset.id) }"
            :style="store.selectedIds.has(asset.id) ? { '--chip-color': asset.color } : {}"
            :title="asset.description"
            @click="store.toggleAsset(asset.id)"
          >
            <span class="chip-dot" :style="{ background: asset.color }"></span>
            {{ asset.name }}
            <span class="chip-remove" @click.stop="store.removeCustomAsset(asset.id)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </span>
          </button>
        </div>
        <div class="add-ticker">
          <div class="add-ticker-input-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              v-model="tickerInput"
              type="text"
              placeholder="Add ticker (e.g. TSLA)"
              class="ticker-input"
              @keydown="onTickerKeydown"
            />
            <button class="add-btn" @click="addTicker" :disabled="!tickerInput.trim()">Add</button>
          </div>
          <span v-if="addError" class="add-error">{{ addError }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.asset-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

h3 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-btn:hover {
  color: var(--text);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.chip:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.chip.active {
  border-color: var(--chip-color, var(--accent));
  background: color-mix(in srgb, var(--chip-color, var(--accent)) 12%, transparent);
  color: var(--text);
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.custom-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chip-remove {
  display: inline-flex;
  align-items: center;
  margin-left: 0.15rem;
  opacity: 0.5;
  transition: opacity 0.15s;
}

.chip-remove:hover {
  opacity: 1;
}

.add-ticker {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.add-ticker-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 0.25rem 0.35rem 0.25rem 0.7rem;
  max-width: 280px;
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.ticker-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.8rem;
  font-family: inherit;
  min-width: 0;
}

.ticker-input::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.add-btn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.add-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.add-btn:not(:disabled):hover {
  opacity: 0.85;
}

.add-error {
  color: #ef4444;
  font-size: 0.7rem;
  padding-left: 0.5rem;
}

@media (max-width: 500px) {
  .chip {
    font-size: 0.75rem;
    padding: 0.3rem 0.55rem;
  }
}
</style>
