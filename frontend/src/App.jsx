import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')

const tabs = ['Top', 'Trending', 'Watchlist', 'Prediction Markets', 'Most Visited', 'New']

function valueClass(value) {
  if (value === null || value === undefined) return 'text-slate-400'
  return value >= 0 ? 'text-emerald-500' : 'text-rose-500'
}

function formatPercent(value) {
  if (value === null || value === undefined) return '—'
  const arrow = value >= 0 ? '▲' : '▼'
  return `${arrow} ${Math.abs(value).toFixed(2)}%`
}

function formatMoney(value) {
  if (value === null || value === undefined) return '—'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export default function App() {
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [chips, setChips] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      if (!API_BASE) {
        throw new Error('VITE_API_BASE is required for production builds')
      }

      const [summaryRes, trendingRes] = await Promise.all([
        fetch(`${API_BASE}/api/market-summary`),
        fetch(`${API_BASE}/api/trending?q=${encodeURIComponent(search)}&limit=15`)
      ])

      const summaryData = await summaryRes.json()
      const trendingData = await trendingRes.json()

      setSummary(summaryData)
      setRows(trendingData.rows || [])
      setChips(trendingData.chips || [])
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [search])

  const cards = summary?.cards
  const updatedAt = useMemo(() => {
    if (!summary?.updatedAt) return ''
    return new Date(summary.updatedAt).toLocaleString()
  }, [summary])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="mx-auto max-w-[1700px] px-4 pt-4">
        <div className="rounded-xl bg-white px-6 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black">Crypto Dashboard</h1>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coin..."
              className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <nav className="mt-5 flex flex-wrap gap-6 text-3xl text-slate-500">
            {tabs.map((tab) => (
              <span
                key={tab}
                className={tab === 'Trending' ? 'border-b-4 border-blue-500 pb-2 font-semibold text-slate-900' : ''}
              >
                {tab}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] px-4 py-4">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">Market Cap</div>
            <div className="mt-1 text-4xl font-bold">{cards?.marketCap || '—'}</div>
            <div className={`text-sm ${valueClass(cards?.marketCapChange24h)}`}>{formatPercent(cards?.marketCapChange24h)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">24h Volume</div>
            <div className="mt-1 text-4xl font-bold">{cards?.volume24h || '—'}</div>
            <div className="text-sm text-slate-500">Global trading activity</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">Fear & Greed</div>
            <div className="mt-1 text-4xl font-bold">{cards?.fearGreed || '—'}</div>
            <div className="text-sm text-slate-500">Synthetic sentiment gauge</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">BTC Price</div>
            <div className="mt-1 text-4xl font-bold">{formatMoney(cards?.btcPrice)}</div>
            <div className="text-sm text-slate-500">Live spot estimate</div>
          </div>
        </section>

        <section className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-slate-300 bg-white px-4 py-1 text-sm">
              {chip}
            </span>
          ))}
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">1h %</th>
                  <th className="px-4 py-3 text-right">24h %</th>
                  <th className="px-4 py-3 text-right">7d %</th>
                  <th className="px-4 py-3 text-right">Market Cap</th>
                  <th className="px-4 py-3 text-right">Volume (24h)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((coin) => (
                  <tr key={`${coin.rank}-${coin.symbol}`} className="border-b last:border-0">
                    <td className="px-4 py-3">{coin.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.symbol} className="h-6 w-6 rounded-full" />
                        <div>
                          <div className="font-semibold">{coin.name}</div>
                          <div className="text-xs uppercase text-slate-500">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">${Number(coin.price).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right ${valueClass(coin.change1h)}`}>{formatPercent(coin.change1h)}</td>
                    <td className={`px-4 py-3 text-right ${valueClass(coin.change24h)}`}>{formatPercent(coin.change24h)}</td>
                    <td className={`px-4 py-3 text-right ${valueClass(coin.change7d)}`}>{formatPercent(coin.change7d)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(coin.marketCap)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(coin.volume24h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && rows.length === 0 && <div className="p-6 text-center text-slate-500">Nothing found.</div>}
        </section>

        <p className="mt-4 text-xs text-slate-500">Updated: {updatedAt} · Source: CoinGecko</p>
      </main>
    </div>
  )
}
