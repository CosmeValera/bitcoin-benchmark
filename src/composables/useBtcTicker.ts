import { ref, onMounted, onUnmounted } from 'vue'

const priceUsd = ref<number | null>(null)
const priceEur = ref<number | null>(null)
const change24hUsd = ref<number | null>(null)
const change24hEur = ref<number | null>(null)
const loading = ref(false)
let intervalId: ReturnType<typeof setInterval> | null = null
let subscribers = 0

async function fetchQuote(symbol: 'BTC-USD' | 'BTC-EUR') {
  const res = await fetch(
    `/api/yahoo/v8/finance/chart/${symbol}?interval=1d&range=2d`,
  )
  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) return null

  const closes: (number | null)[] = result.indicators.quote[0].close
  const meta = result.meta
  const current = meta?.regularMarketPrice ?? closes[closes.length - 1]
  const prevClose = meta?.chartPreviousClose ?? closes[0]
  const change24h =
    current != null && prevClose != null && prevClose > 0
      ? ((current - prevClose) / prevClose) * 100
      : null

  return { current, change24h }
}

async function fetchPrice() {
  try {
    loading.value = true
    const [usdResult, eurResult] = await Promise.allSettled([
      fetchQuote('BTC-USD'),
      fetchQuote('BTC-EUR'),
    ])
    const usd = usdResult.status === 'fulfilled' ? usdResult.value : null
    const eur = eurResult.status === 'fulfilled' ? eurResult.value : null

    if (usd?.current != null) priceUsd.value = usd.current
    if (usd?.change24h != null) change24hUsd.value = usd.change24h

    if (eur?.current != null) priceEur.value = eur.current
    if (eur?.change24h != null) change24hEur.value = eur.change24h
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

  return { priceUsd, priceEur, change24hUsd, change24hEur, loading }
}
