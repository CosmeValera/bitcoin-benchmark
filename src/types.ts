export interface Asset {
  id: string
  ticker: string
  name: string
  category: AssetCategory
  color: string
  description: string
}

export type AssetCategory = 'bitcoin' | 'treasury' | 'bonds' | 'index'

export interface PricePoint {
  date: string // YYYY-MM-DD
  price: number
}

export interface AssetData {
  asset: Asset
  prices: PricePoint[]
  normalizedReturns: number[] // percentage change from start
}

export interface PerformanceMetrics {
  asset: Asset
  totalReturn: number
  currentPrice: number
  startPrice: number
  high: number
  low: number
  volatility: number
}

export const ASSET_CATEGORIES: { key: AssetCategory; label: string }[] = [
  { key: 'bitcoin', label: 'Bitcoin' },
  { key: 'treasury', label: 'BTC Treasuries' },
  { key: 'bonds', label: 'Strategy Preferred' },
  { key: 'index', label: 'Market Indices' },
]

export const ASSETS: Asset[] = [
  // Bitcoin
  {
    id: 'btc',
    ticker: 'BTC-USD',
    name: 'Bitcoin',
    category: 'bitcoin',
    color: '#f7931a',
    description: 'Bitcoin spot price',
  },

  // BTC Treasury Companies
  {
    id: 'mstr',
    ticker: 'MSTR',
    name: 'Strategy (MSTR)',
    category: 'treasury',
    color: '#e23636',
    description: 'Formerly MicroStrategy — largest public BTC holder',
  },
  {
    id: 'metaplanet',
    ticker: 'MTPLF',
    name: 'Metaplanet',
    category: 'treasury',
    color: '#00c2a8',
    description: 'Japanese Bitcoin treasury company',
  },
  {
    id: 'xxi',
    ticker: 'XXI',
    name: 'Twenty One Capital',
    category: 'treasury',
    color: '#3b82f6',
    description: 'Bitcoin accumulation company backed by Tether & SoftBank',
  },
  {
    id: 'capitalb',
    ticker: 'CPTLF',
    name: 'Capital B',
    category: 'treasury',
    color: '#8b5cf6',
    description: 'Europe\'s first Bitcoin Treasury Company (The Blockchain Group)',
  },
  {
    id: 'swc',
    ticker: 'SWC.L',
    name: 'Smarter Web Co.',
    category: 'treasury',
    color: '#10b981',
    description: 'UK-based Bitcoin treasury company',
  },

  // Strategy Preferred Stock / Bonds
  {
    id: 'strk',
    ticker: 'STRK',
    name: 'STRK (Strike)',
    category: 'bonds',
    color: '#f43f5e',
    description: 'Strategy convertible perpetual preferred stock',
  },
  {
    id: 'strd',
    ticker: 'STRD',
    name: 'STRD (Stride)',
    category: 'bonds',
    color: '#a855f7',
    description: 'Strategy perpetual preferred stock — 10% annual dividend',
  },
  {
    id: 'strf',
    ticker: 'STRF',
    name: 'STRF (Strife)',
    category: 'bonds',
    color: '#fb923c',
    description: 'Strategy preferred stock series F',
  },
  {
    id: 'strc',
    ticker: 'STRC',
    name: 'STRC (Stretch)',
    category: 'bonds',
    color: '#22d3ee',
    description: 'Strategy variable rate series A perpetual stretch preferred stock',
  },

  // Market Indices
  {
    id: 'spy',
    ticker: 'SPY',
    name: 'S&P 500 (SPY)',
    category: 'index',
    color: '#94a3b8',
    description: 'S&P 500 index ETF',
  },
  {
    id: 'qqq',
    ticker: 'QQQ',
    name: 'Nasdaq 100 (QQQ)',
    category: 'index',
    color: '#64748b',
    description: 'Nasdaq 100 index ETF',
  },
]

export type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | '2Y' | '3Y' | '5Y' | 'ALL' | 'CUSTOM'

export function getDateForRange(range: TimeRange): Date {
  const now = new Date()
  switch (range) {
    case '1M':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case '3M':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '6M':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1)
    case '1Y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case '2Y':
      return new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
    case '3Y':
      return new Date(now.getFullYear() - 3, now.getMonth(), now.getDate())
    case '5Y':
      return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
    case 'ALL':
      return new Date(2015, 0, 1)
    case 'CUSTOM':
      return new Date(2020, 0, 1)
  }
}
