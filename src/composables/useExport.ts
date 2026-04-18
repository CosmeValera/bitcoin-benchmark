import type { PerformanceMetrics } from '@/types'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useExport() {
  function exportCsv(metrics: PerformanceMetrics[]) {
    const headers = ['Asset', 'Return (%)', 'Start Price', 'Current Price', 'High', 'Low', 'Volatility (%)']
    const rows = metrics.map((m) => [
      m.asset.name,
      m.totalReturn.toFixed(1),
      m.startPrice.toFixed(2),
      m.currentPrice.toFixed(2),
      m.high.toFixed(2),
      m.low.toFixed(2),
      m.volatility.toFixed(1),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    download(new Blob([csv], { type: 'text/csv' }), 'benchmark.csv')
  }

  function exportPng(canvas: HTMLCanvasElement, filename = 'benchmark.png') {
    canvas.toBlob((blob) => {
      if (blob) download(blob, filename)
    })
  }

  return { exportCsv, exportPng }
}
