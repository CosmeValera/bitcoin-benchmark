<script setup lang="ts">
import { useComparisonStore } from '@/stores/comparison'
import AssetSelector from '@/components/AssetSelector.vue'
import TimeRangeSelector from '@/components/TimeRangeSelector.vue'
import ComparisonChart from '@/components/ComparisonChart.vue'
import PerformanceTable from '@/components/PerformanceTable.vue'

const store = useComparisonStore()
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

.btn-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
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
