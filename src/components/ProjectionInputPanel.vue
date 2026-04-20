<script setup lang="ts">
import { useProjectionStore } from '@/stores/projection'

const store = useProjectionStore()

function handleSubmit() {
  store.runProjection()
}
</script>

<template>
  <section class="input-panel">
    <div class="panel-title-area">
      <h2>Projection Parameters</h2>
      <p class="panel-subtitle">Model future compound growth with recurring contributions.</p>
    </div>
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="field">
          <label for="proj-initial">Initial Investment (USD)</label>
          <input
            id="proj-initial"
            type="number"
            min="0"
            step="100"
            v-model.number="store.initialInvestment"
          />
        </div>

        <div class="field">
          <label for="proj-monthly">Monthly Contribution (USD)</label>
          <input
            id="proj-monthly"
            type="number"
            min="0"
            step="10"
            v-model.number="store.monthlyContribution"
          />
        </div>

        <div class="field">
          <label for="proj-return">Expected Annual Return (%)</label>
          <input
            id="proj-return"
            type="number"
            min="0"
            max="100"
            step="0.5"
            v-model.number="store.annualReturn"
          />
        </div>

        <div class="field">
          <label for="proj-years">Investment Period (Years)</label>
          <input
            id="proj-years"
            type="number"
            min="1"
            max="50"
            step="1"
            v-model.number="store.investmentYears"
          />
        </div>

        <div class="field">
          <label for="proj-compound">Compounding Frequency</label>
          <select id="proj-compound" v-model.number="store.compoundingFrequency">
            <option :value="1">Annually</option>
            <option :value="4">Quarterly</option>
            <option :value="12">Monthly</option>
            <option :value="365">Daily</option>
          </select>
        </div>
      </div>

      <button type="submit" class="btn-primary">
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
        </svg>
        CALCULATE PROJECTION
      </button>
    </form>
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
  font-family: 'JetBrains Mono', monospace;
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
  font-family: 'JetBrains Mono', monospace;
  width: 100%;
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

.btn-primary:hover {
  background: var(--accent-hover);
}

@media (max-width: 500px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
