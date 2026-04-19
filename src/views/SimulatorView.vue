<script setup lang="ts">
import InputPanel from '@/components/InputPanel.vue'
import PriceChart from '@/components/PriceChart.vue'
import ResultsSummary from '@/components/ResultsSummary.vue'
import { useSimulationStore } from '@/stores/simulation'

const store = useSimulationStore()
</script>

<template>
  <div class="simulator">
    <section class="config-panel">
      <div class="section-label">
        <span class="section-dot"></span>
        <span class="section-num">#1 · CONFIGURE</span>
      </div>
      <InputPanel />
    </section>

    <section v-if="store.hasRun" class="results-panel">
      <div class="section-label">
        <span class="section-dot green"></span>
        <span class="section-num">#2 · RESULTS</span>
      </div>
      <PriceChart />
      <ResultsSummary />
    </section>
  </div>
</template>

<style scoped>
.simulator {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-panel,
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
</style>
