<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useComparisonStore } from '@/stores/comparison'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
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

useKeyboardShortcuts([
  {
    key: 'Enter',
    ctrl: true,
    action: () => { if (!store.loading) store.runComparison() },
    description: 'Run comparison',
  },
  {
    key: 'a',
    ctrl: true,
    shift: true,
    action: () => { store.autoRun = !store.autoRun },
    description: 'Toggle auto-run',
  },
  {
    key: 'd',
    ctrl: true,
    shift: true,
    action: () => { store.showDrawdown = !store.showDrawdown },
    description: 'Toggle drawdowns',
  },
])

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
      <div class="section-label">
        <span class="section-dot"></span>
        <span class="section-num">#1 · SELECT</span>
      </div>

      <div class="panel-section">
        <div class="panel-title-area">
          <h2>Asset Selection</h2>
          <p class="panel-subtitle">Pick assets to compare their historical performance side by side.</p>
        </div>
        <AssetSelector />
      </div>

      <div class="panel-divider"></div>

      <div class="panel-section">
        <div class="time-range-row">
          <h2>Time Range</h2>
          <TimeRangeSelector
            :model-value="store.timeRange"
            @update:model-value="store.setTimeRange($event)"
            :custom-start="store.customStartDate"
            @update:custom-start="store.customStartDate = $event"
            :custom-end="store.customEndDate"
            @update:custom-end="store.customEndDate = $event"
          />
        </div>
      </div>

      <div class="panel-divider"></div>

      <div class="panel-section">
        <div class="options-row">
          <div class="option-group">
            <span class="option-label">Currency</span>
            <div class="currency-buttons">
              <button
                v-for="c in (['USD', 'EUR', 'BTC', 'sats'] as const)"
                :key="c"
                class="pill-btn"
                :class="{ active: store.displayCurrency === c }"
                @click="store.displayCurrency = c"
              >
                {{ c }}
              </button>
            </div>
          </div>
          <label class="toggle-label">
            <input type="checkbox" v-model="store.showDividendAdjusted" />
            Include dividend income
          </label>
          <label class="toggle-label">
            <input type="checkbox" v-model="store.showDrawdown" />
            Show drawdowns
          </label>
        </div>
      </div>

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
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm3.44-1.06a.75.75 0 111.06 1.06L11.06 10l1.72 1.72a.75.75 0 11-1.06 1.06l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25z" clip-rule="evenodd" />
            </svg>
            COMPARE {{ store.selectedIds.size }} ASSET{{ store.selectedIds.size !== 1 ? 'S' : '' }}
          </template>
        </button>
        <button
          class="btn-auto"
          :class="{ active: store.autoRun }"
          @click="store.autoRun = !store.autoRun"
          title="Auto-run comparison when parameters change"
        >
          Auto
        </button>
      </div>
    </section>

    <!-- Results -->
    <section v-if="store.hasRun && store.assetsData.length" class="results-panel">
      <div class="section-label">
        <span class="section-dot green"></span>
        <span class="section-num">#2 · RESULTS</span>
      </div>

      <ComparisonChart />

      <div class="panel-divider"></div>

      <PerformanceTable />

      <div class="perf-actions">
        <button class="btn-share" @click="share" :disabled="!store.hasRun">
          {{ copied ? 'Copied!' : 'Share' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-panel,
.results-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.section-dot.green {
  background: var(--green);
}

.section-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.panel-title-area {
  margin-bottom: 1rem;
}

.panel-title-area h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.2rem;
  letter-spacing: -0.01em;
}

.panel-subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.panel-section h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.panel-divider {
  height: 1px;
  background: var(--border);
}

.time-range-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.currency-buttons {
  display: flex;
  gap: 0.25rem;
}

.pill-btn {
  font-family: 'JetBrains Mono', monospace;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.pill-btn:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.pill-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
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
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex: 1;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.btn-compare:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-compare:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-auto {
  font-family: 'JetBrains Mono', monospace;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.btn-auto:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.btn-auto.active {
  background: var(--green);
  border-color: var(--green);
  color: #fff;
}

.perf-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-share {
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8rem;
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

@media (max-width: 600px) {
  .time-range-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .options-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
