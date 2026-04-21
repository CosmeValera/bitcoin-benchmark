<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import PortfolioWeights from '@/components/PortfolioWeights.vue'
import PortfolioChart from '@/components/PortfolioChart.vue'
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import TimeRangeSelector from '@/components/TimeRangeSelector.vue'

const store = usePortfolioStore()
const copied = ref(false)

function share() {
  const url = store.toShareUrl()
  navigator.clipboard.writeText(url).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}

useKeyboardShortcuts([
  {
    key: 'Enter',
    ctrl: true,
    action: () => { if (!store.loading && store.isValid) store.runPortfolio() },
    description: 'Build portfolio',
  },
  {
    key: 'a',
    ctrl: true,
    shift: true,
    action: () => { store.autoRun = !store.autoRun },
    description: 'Toggle auto-run',
  },
])

const hasDividendAssets = computed(() => {
  const activeIds = Object.entries(store.allocations).filter(([, w]) => w > 0).map(([id]) => id)
  return store.allAssets.some((a) => activeIds.includes(a.id) && a.dividendRate)
})

onMounted(() => {
  store.initFromUrl()
  if (!store.hasRun && store.isValid) {
    store.runPortfolio()
  }
})
</script>

<template>
  <div class="portfolio">
    <section class="control-panel">
      <div class="section-label">
        <span class="section-dot"></span>
        <span class="section-num">#1 · ALLOCATE</span>
      </div>

      <PortfolioWeights />

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
          <label class="toggle-label" :class="{ disabled: !hasDividendAssets }">
            <input type="checkbox" v-model="store.showDividendAdjusted" :disabled="!hasDividendAssets" />
            Include dividend income
            <span v-if="!hasDividendAssets" class="toggle-hint">(add STRK, STRD, STRF, or STRC with weight > 0)</span>
          </label>
        </div>
      </div>

      <div class="action-row">
        <button
          class="btn-run"
          :disabled="store.loading || !store.isValid"
          @click="store.runPortfolio()"
        >
          <template v-if="store.loading">Loading...</template>
          <template v-else-if="!store.isValid">
            Set at least one asset weight
          </template>
          <template v-else>
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            BUILD PORTFOLIO
          </template>
        </button>
        <button
          class="btn-auto"
          :class="{ active: store.autoRun }"
          @click="store.autoRun = !store.autoRun"
          title="Auto-run portfolio when parameters change"
        >
          Auto
        </button>
      </div>
    </section>

    <section v-if="store.hasRun && store.result" class="performance-panel">
      <div class="section-label">
        <span class="section-dot green"></span>
        <span class="section-num">#2 · PERFORMANCE</span>
      </div>

      <PortfolioChart />
      <PortfolioSummary />

      <div class="perf-actions" v-if="store.hasRun">
        <button
          class="btn-share"
          @click="share"
          :title="copied ? 'Copied!' : 'Copy shareable URL'"
        >
          {{ copied ? 'Copied!' : 'Share' }}
        </button>
      </div>
    </section>

    <div v-if="store.errors.size > 0" class="errors-panel">
      <p v-for="[id, msg] in store.errors" :key="id" class="error-line">{{ msg }}</p>
    </div>
  </div>
</template>

<style scoped>
.portfolio {
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
  justify-content: space-between;
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

.toggle-label.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toggle-label input[type="checkbox"] {
  accent-color: var(--accent);
}

.toggle-hint {
  font-size: 0.68rem;
  font-style: italic;
  opacity: 0.7;
}

.action-row {
  display: flex;
  gap: 0.5rem;
}

.btn-run {
  font-family: 'JetBrains Mono', monospace;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.btn-run:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
  font-size: 0.9rem;
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

.performance-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.btn-share:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.errors-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  border: 1px solid var(--border);
}

.error-line {
  font-size: 0.8rem;
  color: var(--warning);
  margin: 0.25rem 0;
}

@media (max-width: 600px) {
  .time-range-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
