<script setup lang="ts">
import { useComparisonStore } from '@/stores/comparison'
import type { TimeRange } from '@/types'

const store = useComparisonStore()

const ranges: TimeRange[] = ['1M', '3M', '6M', 'YTD', '1Y', '2Y', '3Y', '5Y', 'ALL', 'CUSTOM']
</script>

<template>
  <div class="time-range-selector">
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
        <label for="custom-start">From</label>
        <input id="custom-start" type="date" v-model="store.customStartDate" />
      </div>
      <div class="field">
        <label for="custom-end">To</label>
        <input id="custom-end" type="date" v-model="store.customEndDate" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-range-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.range-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.range-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
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
</style>
