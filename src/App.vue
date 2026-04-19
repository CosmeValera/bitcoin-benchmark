<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()
</script>

<template>
  <div class="app">
    <header>
      <div class="header-content">
        <div class="header-top">
          <div class="logo">
            <span class="logo-icon">₿</span>
            <h1>Bitcoin Finance Lab</h1>
          </div>
          <button class="theme-toggle" @click="toggle" :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
            <span v-if="theme === 'dark'">&#9788;</span>
            <span v-else>&#9790;</span>
          </button>
        </div>
        <p class="subtitle">
          Build portfolios, benchmark assets, and simulate DCA strategies with real market data
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
      <p>
        Market data via Yahoo Finance.
        Built with <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>,
        <a href="https://pinia.vuejs.org/" target="_blank" rel="noopener">Pinia</a> &amp;
        <a href="https://www.chartjs.org/" target="_blank" rel="noopener">Chart.js</a>.
      </p>
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
  gap: 0.65rem;
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
  font-size: 1.75rem;
  color: #f7931a;
  font-weight: 700;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.nav-tabs {
  display: flex;
  gap: 0;
  margin-top: 1rem;
  border-bottom: 1px solid var(--border);
}

.tab {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
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
  padding: 1.25rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

footer a {
  color: var(--accent);
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}
</style>
