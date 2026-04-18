<script setup lang="ts">
import InputPanel from '@/components/InputPanel.vue'
import PriceChart from '@/components/PriceChart.vue'
import ResultsSummary from '@/components/ResultsSummary.vue'
</script>

<template>
  <div class="simulator">
    <InputPanel />
    <PriceChart />
    <ResultsSummary />
  </div>
</template>

<style scoped>
.simulator {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
