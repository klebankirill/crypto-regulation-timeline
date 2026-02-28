import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')

const topMenu = ['Cryptocurrencies', 'Dashboards', 'DexScan', 'Exchanges', 'Community', 'Products']
const tabs = ['Top', 'Trending', 'Watchlist', 'Prediction Markets', 'Most Visited', 'New', 'More']

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

function Sparkline({ tone = 'red' }) {
  return (
    <svg viewBox="0 0 240 48" className="mt-2 h-10 w-full">
      <path
        d="M4 14 C 30 5, 44 36, 68 28 C 88 20, 102 40, 126 30 C 148 21, 172 34, 196 24 C 216 16, 230 24, 236 20"
        fill="none"
        stroke={tone === 'green' ? '#10b981' : '#ef4444'}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-8">
            <div className="shrink-0 text-2xl font-black tracking-tight">Crypto Tracker</div>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 xl:flex">
              {topMenu.map((item) => (
                <span key={item} className="cursor-pointer hover:text-slate-900">
                  {item}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-32 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm outline-none transition focus:w-44 focus:border-slate-400"
            />
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Log In</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1700px] items-center gap-8 overflow-x-auto px-4 py-3 text-3xl">
          {tabs.map((tab) => (
            <span
              key={tab}
              className={`shrink-0 cursor-pointer pb-2 ${
                tab === 'Trending' ? 'border-b-4 border-blue-600 font-semibold text-slate-900' : 'text-slate-500'
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] px-4 py-4">
        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-500">Market Cap</div>
            <div className="mt-1 text-4xl font-black">{cards?.marketCap || '—'}</div>
            <div className={`mt-1 text-sm font-semibold ${valueClass(cards?.marketCapChange24h)}`}>
              {formatPercent(cards?.marketCapChange24h)}
            </div>
            <Sparkline />
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-500">CMC20</div>
            <div className="mt-1 text-4xl font-black">{cards?.volume24h || '—'}</div>
            <div className="mt-1 text-sm font-semibold text-rose-500">{formatPercent(-3.76)}</div>
            <Sparkline />
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-500">Fear & Greed</div>
            <div className="mt-1 text-4xl font-black">{cards?.fearGreed || '—'}</div>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500" style={{ width: '64%' }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Extreme fear</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-500">BTC Price</div>
            <div className="mt-1 text-4xl font-black">{formatMoney(cards?.btcPrice)}</div>
            <div className="mt-1 text-sm text-slate-500">Bitcoin spot estimate</div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-amber-500" style={{ width: '35%' }} />
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white">
            <div className="text-sm text-slate-300">Average Crypto RSI</div>
            <div className="mt-1 text-4xl font-black">44.88</div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-700">
              <div className="h-2 rounded-full bg-cyan-400" style={{ width: '45%' }} />
            </div>
            <p className="mt-3 text-xs text-slate-400">Oversold → Overbought</p>
          </article>
        </section>

        <section className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-sm font-medium text-violet-700">
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
                  <tr key={`${coin.rank}-${coin.symbol}`} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{coin.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.symbol} className="h-7 w-7 rounded-full" />
                        <div>
                          <div className="font-semibold">{coin.name}</div>
                          <div className="text-xs uppercase text-slate-500">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">${Number(coin.price).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${valueClass(coin.change1h)}`}>{formatPercent(coin.change1h)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${valueClass(coin.change24h)}`}>{formatPercent(coin.change24h)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${valueClass(coin.change7d)}`}>{formatPercent(coin.change7d)}</td>
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
