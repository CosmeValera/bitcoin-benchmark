import { ref, onMounted, onUnmounted } from 'vue'

const price = ref<number | null>(null)
const change24h = ref<number | null>(null)
const loading = ref(false)
let intervalId: ReturnType<typeof setInterval> | null = null
let subscribers = 0

async function fetchPrice() {
  try {
    loading.value = true
    const res = await fetch(
      '/api/yahoo/v8/finance/chart/BTC-USD?interval=1d&range=2d',
    )
    const json = await res.json()
    const result = json.chart?.result?.[0]
    if (!result) return

    const closes: (number | null)[] = result.indicators.quote[0].close
    const meta = result.meta
    const current = meta?.regularMarketPrice ?? closes[closes.length - 1]
    const prevClose = meta?.chartPreviousClose ?? closes[0]

    if (current != null) price.value = current
    if (current != null && prevClose != null && prevClose > 0) {
      change24h.value = ((current - prevClose) / prevClose) * 100
    }
  } catch {
    // Silently fail — ticker is non-critical
  } finally {
    loading.value = false
  }
}

export function useBtcTicker() {
  onMounted(() => {
    subscribers++
    if (subscribers === 1) {
      fetchPrice()
      intervalId = setInterval(fetchPrice, 60_000) // refresh every 60s
    }
  })

  onUnmounted(() => {
    subscribers--
    if (subscribers === 0 && intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
  })

  return { price, change24h, loading }
}
