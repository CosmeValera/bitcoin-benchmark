<template>
  <details class="guide-card">
    <summary>
      <span>DCA vs Lump Sum</span>
      <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" class="chevron">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </summary>

    <div class="guide-body">
      <b>Definitions of Dollar-cost averaging <small>and</small> Lump Sum</b>
      <p><b>Dollar-cost averaging (DCA)</b> means investing a fixed amount on a recurring schedule, for example, buying $100 of Bitcoin every month regardless of price.</p>
      <p><b>Lump Sum investing</b> means investing all available capital at once, giving the full amount immediate market exposure.</p>
      <b>When is each one better?</b>
      <p>DCA reduces timing risk because purchases are spread across different market conditions. When prices fall or move sideways after you begin investing, later contributions can buy more units at lower prices.</p>
      <p>Lump sum investing tends to outperform when prices rise steadily over time, since more capital is exposed to the market earlier and has longer to compound.</p>
      <b>What should I Pick?</b>
      <p>The choice often depends on cash flow, risk tolerance, and investor behavior. Investors contributing from regular income may prefer DCA, while investors already holding available cash may prefer lump sum exposure.</p>
      <p>Neither strategy guarantees better results in every market environment. This simulator helps illustrate how each approach would have performed historically using the same investment amount.</p>
    </div>
  </details>
</template>

<style scoped>
.guide-card {
  background: var(--card-inner-bg, var(--bg));
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.guide-card[open] {
  border-style: solid;
}

summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  color: var(--text-muted);
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

summary:hover {
  color: var(--text);
}

.chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.guide-card[open] .chevron {
  transform: rotate(180deg);
}

.guide-body {
  display: grid;
  gap: 0.55rem;
  padding: 0 1rem 1rem;
}

p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.55;
}
</style>
