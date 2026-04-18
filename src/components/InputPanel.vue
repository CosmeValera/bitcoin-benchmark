<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'

const store = useSimulationStore()

function handleSubmit() {
  store.runSimulation()
}
</script>

<template>
  <section class="input-panel">
    <h2>Simulation Parameters</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="field">
          <label for="start-date">Start Date</label>
          <input id="start-date" type="date" v-model="store.startDate" />
        </div>

        <div class="field">
          <label for="end-date">End Date</label>
          <input id="end-date" type="date" v-model="store.endDate" />
        </div>

        <div class="field">
          <label for="monthly">Investment Amount (USD)</label>
          <input
            id="monthly"
            type="number"
            min="1"
            step="1"
            v-model.number="store.monthlyInvestment"
          />
        </div>

        <div class="field">
          <label for="frequency">Frequency (days)</label>
          <select id="frequency" v-model.number="store.frequencyDays">
            <option :value="1">Daily</option>
            <option :value="7">Weekly</option>
            <option :value="14">Bi-weekly</option>
            <option :value="30">Monthly</option>
          </select>
        </div>
      </div>

      <button type="submit" class="btn-primary" :disabled="store.loading">
        {{ store.loading ? 'Loading...' : 'Run Simulation' }}
      </button>
    </form>

    <p v-if="store.error" class="error">{{ store.error }}</p>
  </section>
</template>

<style scoped>
.input-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
}

h2 {
  margin: 0 0 1.25rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

input,
select {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text);
  font-size: 0.95rem;
  font-family: inherit;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #ef4444;
  margin-top: 0.75rem;
  font-size: 0.875rem;
}

@media (max-width: 500px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
