<script setup lang="ts">
import { ref } from 'vue'
import InputPanel from '@/components/InputPanel.vue'
import PriceChart from '@/components/PriceChart.vue'
import ResultsSummary from '@/components/ResultsSummary.vue'
import ProjectionInputPanel from '@/components/ProjectionInputPanel.vue'
import ProjectionChart from '@/components/ProjectionChart.vue'
import ProjectionSummary from '@/components/ProjectionSummary.vue'
import { useSimulationStore } from '@/stores/simulation'
import { useProjectionStore } from '@/stores/projection'

const mode = ref<'historical' | 'projection'>('historical')
const simStore = useSimulationStore()
const projStore = useProjectionStore()
</script>

<template>
  <div class="simulator">
    <div class="mode-toggle">
      <button
        class="mode-btn"
        :class="{ active: mode === 'historical' }"
        @click="mode = 'historical'"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
        </svg>
        Historical
      </button>
      <button
        class="mode-btn"
        :class="{ active: mode === 'projection' }"
        @click="mode = 'projection'"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
        </svg>
        Projection
      </button>
    </div>

    <!-- Historical DCA Mode -->
    <template v-if="mode === 'historical'">
      <section class="config-panel">
        <div class="section-label">
          <span class="section-dot"></span>
          <span class="section-num">#1 · CONFIGURE</span>
        </div>
        <InputPanel />
      </section>

      <section v-if="simStore.hasRun" class="results-panel">
        <div class="section-label">
          <span class="section-dot green"></span>
          <span class="section-num">#2 · RESULTS</span>
        </div>
        <PriceChart />
        <ResultsSummary />
      </section>
    </template>

    <!-- Projection Mode -->
    <template v-if="mode === 'projection'">
      <section class="config-panel">
        <div class="section-label">
          <span class="section-dot"></span>
          <span class="section-num">#1 · CONFIGURE</span>
        </div>
        <ProjectionInputPanel />
      </section>

      <section v-if="projStore.hasRun" class="results-panel">
        <div class="section-label">
          <span class="section-dot green"></span>
          <span class="section-num">#2 · RESULTS</span>
        </div>
        <ProjectionChart />
        <ProjectionSummary />
      </section>
    </template>
  </div>
</template>

<style scoped>
.simulator {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mode-toggle {
  display: flex;
  gap: 0.25rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.25rem;
  align-self: flex-start;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.02em;
}

.mode-btn:hover:not(.active) {
  color: var(--text);
}

.mode-btn.active {
  background: var(--accent);
  color: #fff;
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
