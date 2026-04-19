<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import type { TimeRange } from '@/types'
import PortfolioWeights from '@/components/PortfolioWeights.vue'
import PortfolioChart from '@/components/PortfolioChart.vue'
import PortfolioSummary from '@/components/PortfolioSummary.vue'

const store = usePortfolioStore()
const ranges: TimeRange[] = ['1M', '3M', '6M', 'YTD', '1Y', '2Y', '3Y', '5Y', 'ALL', 'CUSTOM']
const copied = ref(false)

function share() {
  const url = store.toShareUrl()
  navigator.clipboard.writeText(url).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}

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
          <div class="range-buttons">
            <button
              v-for="r in ranges"
              :key="r"
              class="range-btn"
              :class="{ active: store.timeRange === r }"
              @click="store.setTimeRange(r)"
            >
              {{ r }}
            </button>
          </div>
        </div>
        <div v-if="store.timeRange === 'CUSTOM'" class="custom-dates">
          <div class="field">
            <label>From</label>
            <input type="date" v-model="store.customStartDate" />
          </div>
          <div class="field">
            <label>To</label>
            <input type="date" v-model="store.customEndDate" />
          </div>
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

.range-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.range-btn {
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

.range-btn:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.range-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.custom-dates {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
}

.field input {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text);
  font-size: 0.85rem;
  font-family: inherit;
}

.field input:focus {
  outline: none;
  border-color: var(--accent);
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
