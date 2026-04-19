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
      <PortfolioWeights />

      <div class="panel-divider"></div>

      <div class="panel-section">
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
          <template v-else>Build Portfolio</template>
        </button>
        <button
          v-if="store.hasRun"
          class="btn-share"
          @click="share"
          :title="copied ? 'Copied!' : 'Copy shareable URL'"
        >
          {{ copied ? 'Copied!' : 'Share' }}
        </button>
      </div>
    </section>

    <PortfolioChart />
    <PortfolioSummary />

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

.panel-section h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.panel-divider {
  height: 1px;
  background: var(--border);
}

.range-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.range-btn {
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

.btn-run:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-share {
  padding: 0.8rem 1.2rem;
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
</style>
