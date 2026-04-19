<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'

const store = useSimulationStore()

function handleSubmit() {
  store.runSimulation()
}
</script>

<template>
  <section class="input-panel">
    <div class="panel-title-area">
      <h2>Simulation Parameters</h2>
      <p class="panel-subtitle">Configure your DCA strategy and compare against lump sum investing.</p>
    </div>
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
          <label for="frequency">Frequency</label>
          <select id="frequency" v-model.number="store.frequencyDays">
            <option :value="1">Daily</option>
            <option :value="7">Weekly</option>
            <option :value="14">Bi-weekly</option>
            <option :value="30">Monthly</option>
          </select>
        </div>
      </div>

      <button type="submit" class="btn-primary" :disabled="store.loading">
        <template v-if="store.loading">
          <span class="spinner"></span>
          Loading...
        </template>
        <template v-else>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          RUN SIMULATION
        </template>
      </button>
    </form>

    <p v-if="store.error" class="error">{{ store.error }}</p>
  </section>
</template>

<style scoped>
.input-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
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

.error {
  color: var(--red);
  margin: 0;
  font-size: 0.85rem;
}

@media (max-width: 500px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
