import { ref } from 'vue'

export interface TickerSuggestion {
  symbol: string
  name: string
  type: string       // e.g. "EQUITY", "ETF", "CRYPTOCURRENCY"
  exchange: string   // e.g. "NMS", "NYQ"
}

let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function useTickerSearch() {
  const suggestions = ref<TickerSuggestion[]>([])
  const searching = ref(false)

  async function search(query: string) {
    // Clear previous
    if (debounceTimer) clearTimeout(debounceTimer)
    if (abortController) abortController.abort()

    const q = query.trim()
    if (q.length < 1) {
      suggestions.value = []
      searching.value = false
      return
    }

    searching.value = true

    // Debounce 250ms
    await new Promise<void>((resolve) => {
      debounceTimer = setTimeout(resolve, 250)
    })

    abortController = new AbortController()

    try {
      const res = await fetch(
        `/api/yahoo/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=6&newsCount=0`,
        { signal: abortController.signal },
      )

      if (!res.ok) {
        suggestions.value = []
        searching.value = false
        return
      }

      const json = await res.json()
      const quotes: any[] = json.quotes ?? []

      suggestions.value = quotes
        .filter((q: any) => q.symbol && q.isYahooFinance !== false)
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          type: q.quoteType || q.typeDisp || '',
          exchange: q.exchDisp || q.exchange || '',
        }))
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        suggestions.value = []
      }
    } finally {
      searching.value = false
    }
  }

  function clear() {
    suggestions.value = []
    searching.value = false
    if (debounceTimer) clearTimeout(debounceTimer)
    if (abortController) abortController.abort()
  }

  async function validateTicker(ticker: string): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const weekAgo = now - 7 * 86400
      const res = await fetch(
        `/api/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${weekAgo}&period2=${now}&interval=1d`,
      )
      if (!res.ok) return false
      const json = await res.json()
      const result = json.chart?.result?.[0]
      return !!(result && result.timestamp && result.timestamp.length > 0)
    } catch {
      return false
    }
  }

  return { suggestions, searching, search, clear, validateTicker }
}
