<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useBtcTicker } from '@/composables/useBtcTicker'

const { theme, toggle } = useTheme()
const { price, change24h } = useBtcTicker()

function formatPrice(p: number): string {
  return p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
</script>

<template>
  <div class="app">
    <header>
      <div class="header-content">
        <div class="header-top">
          <div class="logo">
            <span class="logo-icon">B</span>
            <h1><span class="logo-btc">Bitcoin</span> Finance Lab</h1>
          </div>
          <div class="header-right">
            <div v-if="price != null" class="btc-ticker">
              <span class="ticker-live-dot"></span>
              <span class="ticker-label">LIVE</span>
              <span class="ticker-sep">·</span>
              <span class="ticker-label">BTC</span>
              <span class="ticker-price">{{ formatPrice(price) }}</span>
              <span
                v-if="change24h != null"
                class="ticker-change"
                :class="change24h >= 0 ? 'up' : 'down'"
              >
                {{ change24h >= 0 ? '+' : '' }}{{ change24h.toFixed(2) }}%
              </span>
            </div>
            <button class="theme-toggle" @click="toggle" :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
              <span v-if="theme === 'dark'">&#9788;</span>
              <span v-else>&#9790;</span>
            </button>
          </div>
        </div>
        <p class="subtitle">
          Build portfolios, benchmark assets, and simulate DCA strategies with real market data.
        </p>
        <nav class="nav-tabs">
          <RouterLink to="/" class="tab">Portfolio Builder</RouterLink>
          <RouterLink to="/benchmark" class="tab">Benchmark</RouterLink>
          <RouterLink to="/simulator" class="tab">DCA Simulator</RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer>
      <p class="footer-disclaimer">Built for educational purposes · Not financial advice · Powered by real market data</p>
      <p class="footer-brand">Bitcoin Finance Lab · v1.0</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  border-bottom: 1px solid var(--border);
  padding: 2rem 1.5rem;
}

.header-content {
  max-width: 1060px;
  margin: 0 auto;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btc-ticker {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.ticker-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  flex-shrink: 0;
}

.ticker-label {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 0.03em;
}

.ticker-sep {
  color: var(--text-muted);
  opacity: 0.5;
}

.ticker-price {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text);
  font-weight: 700;
}

.ticker-change {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 0.7rem;
}

.ticker-change.up {
  color: var(--green);
}

.ticker-change.down {
  color: var(--red);
}

.theme-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 1.25rem;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.theme-toggle:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f7931a, #e8860f);
  color: #fff;
  font-size: 1.25rem;
  font-weight: 800;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.3);
  flex-shrink: 0;
}

h1 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

.logo-btc {
  color: var(--accent);
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.nav-tabs {
  display: flex;
  gap: 0;
  margin-top: 1rem;
}

.tab {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.tab:hover {
  color: var(--text);
}

.tab.router-link-exact-active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

main {
  max-width: 1060px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

footer {
  border-top: 1px solid var(--border);
  text-align: center;
  padding: 1.5rem;
}

.footer-disclaimer {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
  font-size: 0.72rem;
  margin: 0 0 0.35rem;
}

.footer-brand {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
  font-size: 0.7rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.6;
}
</style>
