<script setup lang="ts">
import { useComparisonStore } from '@/stores/comparison'
import { ASSETS, ASSET_CATEGORIES } from '@/types'

const store = useComparisonStore()

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

@media (max-width: 500px) {
  .chip {
    font-size: 0.75rem;
    padding: 0.3rem 0.55rem;
  }
}
</style>
