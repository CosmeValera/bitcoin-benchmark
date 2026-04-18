<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import AssetSelector from '@/components/AssetSelector.vue'
import TimeRangeSelector from '@/components/TimeRangeSelector.vue'
import ComparisonChart from '@/components/ComparisonChart.vue'
import PerformanceTable from '@/components/PerformanceTable.vue'

const store = useComparisonStore()
const copied = ref(false)

function share() {
  navigator.clipboard.writeText(store.toShareUrl())
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(() => {
  store.initFromUrl()
  if (store.selectedIds.size > 0 && !store.hasRun) {
    store.runComparison()
  }
})
</script>

<template>
  <div class="home">
    <!-- Control Panel -->
    <section class="control-panel">
      <div class="panel-section">
        <h2>Select Assets</h2>
        <AssetSelector />
      </div>

      <div class="panel-divider"></div>

      <div class="panel-section">
        <h2>Time Range</h2>
        <TimeRangeSelector />
      </div>

      <div class="panel-divider"></div>

      <div class="panel-section">
        <h2>Display Currency</h2>
        <div class="currency-buttons">
          <button
            v-for="c in (['USD', 'BTC', 'sats', 'EUR'] as const)"
            :key="c"
            class="currency-btn"
            :class="{ active: store.displayCurrency === c }"
            @click="store.displayCurrency = c"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <label class="toggle-label">
        <input type="checkbox" v-model="store.showDividendAdjusted" />
        Include dividend income for preferred stocks
      </label>

      <div class="action-row">
        <button
          class="btn-compare"
          :disabled="store.loading || store.selectedIds.size === 0"
          @click="store.runComparison()"
        >
          <template v-if="store.loading">
            <span class="spinner"></span>
            Loading...
          </template>
          <template v-else>
            Compare {{ store.selectedIds.size }} asset{{ store.selectedIds.size !== 1 ? 's' : '' }}
          </template>
        </button>
        <button class="btn-share" @click="share" :disabled="!store.hasRun">
          {{ copied ? 'Copied!' : 'Share' }}
        </button>
      </div>
    </section>

    <!-- Results -->
    <ComparisonChart />
    <PerformanceTable />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel-section h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.panel-divider {
  height: 1px;
  background: var(--border);
}

.currency-buttons {
  display: flex;
  gap: 0.3rem;
}

.currency-btn {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.currency-btn:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.currency-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  accent-color: var(--accent);
}

.action-row {
  display: flex;
  gap: 0.5rem;
}

.btn-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-compare:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-compare:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-share {
  padding: 0.8rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-share:hover:not(:disabled) {
  border-color: var(--text-muted);
  color: var(--text);
}

.btn-share:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
