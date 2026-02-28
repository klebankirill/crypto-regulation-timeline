const API_BASE = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-Hbn4YsqNMrVifvSzqyHAUwK6';
const REFRESH_MS = 60_000;

const coinsBody = document.getElementById('coins-body');
const searchInput = document.getElementById('search');
const refreshBtn = document.getElementById('refresh-btn');
const tabButtons = Array.from(document.querySelectorAll('#tab-nav button[data-tab]'));
const sortButtons = Array.from(document.querySelectorAll('.sort-btn'));

const tabConfig = {
  top: {
    title: 'Top',
    description: 'Классический список по максимальной рыночной капитализации.',
    href: 'https://www.coingecko.com/'
  },
  trending: {
    title: 'Trending',
    description: 'Монеты с наибольшим ростом за 24 часа.',
    href: 'https://www.coingecko.com/en/highlights/trending-crypto'
  },
  watchlist: {
    title: 'Watchlist',
    description: 'Монеты с наибольшим объёмом торгов за 24 часа (как горячий лист наблюдения).',
    href: 'https://www.coingecko.com/en'
  },
  prediction: {
    title: 'Prediction Markets',
    description: 'Монеты с высокой волатильностью (большие изменения за 24 часа).',
    href: 'https://www.coingecko.com/en/categories'
  },
  visited: {
    title: 'Most Visited',
    description: 'Самые известные монеты из топ-20 по капитализации.',
    href: 'https://www.coingecko.com/en/coins/bitcoin'
  }
};

let allCoins = [];
let currentTab = 'trending';
let sortState = { key: 'price_change_percentage_24h', direction: 'desc' };

const buildUrl = (path, query = {}) => {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  if (API_KEY) {
    url.searchParams.set('x_cg_demo_api_key', API_KEY);
  }
  return url.toString();
};

const fetchJson = async (path, query) => {
  const response = await fetch(buildUrl(path, query), {
    cache: 'no-store',
    headers: API_KEY ? { 'x-cg-demo-api-key': API_KEY } : {}
  });

  if (!response.ok) {
    const message = response.status === 429
      ? 'Превышен лимит запросов API. Подождите и попробуйте снова.'
      : `API error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
};

const formatMoney = (value) => {
  if (value == null) return '--';
  return `$${value.toLocaleString('en-US', {
    notation: value >= 1_000_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: value < 1 ? 6 : 2
  })}`;
};

const formatPercent = (value) => {
  if (value == null) return '<span style="color:#9ca3af;">--</span>';
  if (value === 0) return '<span style="color:#6b7280;">0%</span>';

  const sign = value > 0 ? '▲' : '▼';
  const cls = value > 0 ? 'pos' : 'neg';
  return `<span class="${cls}">${sign} ${Math.abs(value).toFixed(2)}%</span>`;
};

const formatTime = (isoString) => {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getComparableValue = (coin, key) => {
  if (key === 'last_updated') {
    return coin.last_updated ? new Date(coin.last_updated).getTime() : 0;
  }
  return coin[key] ?? 0;
};

const sortCoins = (coins) => {
  const { key, direction } = sortState;
  const sorted = [...coins].sort((a, b) => {
    const aValue = getComparableValue(a, key);
    const bValue = getComparableValue(b, key);
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
  });
  return sorted;
};

const filterByTab = (coins) => {
  switch (currentTab) {
    case 'top':
      return [...coins].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
    case 'trending':
      return [...coins].sort((a, b) => (b.price_change_percentage_24h ?? -999) - (a.price_change_percentage_24h ?? -999));
    case 'watchlist':
      return [...coins].sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0));
    case 'prediction':
      return [...coins].sort((a, b) => Math.abs(b.price_change_percentage_24h ?? 0) - Math.abs(a.price_change_percentage_24h ?? 0));
    case 'visited':
      return coins.filter((coin) => (coin.market_cap_rank ?? 9999) <= 20);
    default:
      return coins;
  }
};

const getFilteredCoins = () => {
  const query = searchInput.value.trim().toLowerCase();
  const byTab = filterByTab(allCoins);

  const searched = query
    ? byTab.filter((coin) => coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query))
    : byTab;

  return sortCoins(searched);
};

const updateSortIndicators = () => {
  sortButtons.forEach((button) => {
    const indicator = button.querySelector('.sort-indicator');
    if (!indicator) return;

    if (button.dataset.sortKey === sortState.key) {
      indicator.textContent = sortState.direction === 'asc' ? '↑' : '↓';
      button.classList.add('active-sort');
    } else {
      indicator.textContent = '';
      button.classList.remove('active-sort');
    }
  });
};

const updateTabInfo = () => {
  const cfg = tabConfig[currentTab];
  document.getElementById('tab-title').textContent = cfg.title;
  document.getElementById('tab-description').textContent = cfg.description;
  const link = document.getElementById('tab-link');
  link.href = cfg.href;
};

const renderCoins = (coins) => {
  if (!coins.length) {
    coinsBody.innerHTML = '<tr><td colspan="9">Ничего не найдено по вашему запросу.</td></tr>';
    return;
  }

  coinsBody.innerHTML = coins.map((coin) => `
    <tr>
      <td>${coin.market_cap_rank ?? '-'}</td>
      <td>
        <div class="coin">
          <img class="coin-icon" src="${coin.image}" alt="${coin.symbol}" loading="lazy" />
          <div>${coin.name} <span style="color:#6a7694;font-weight:500;">${coin.symbol.toUpperCase()}</span></div>
        </div>
      </td>
      <td>${formatMoney(coin.current_price)}</td>
      <td>${formatPercent(coin.price_change_percentage_1h_in_currency)}</td>
      <td>${formatPercent(coin.price_change_percentage_24h)}</td>
      <td>${formatMoney(coin.market_cap)}</td>
      <td>${formatMoney(coin.total_volume)}</td>
      <td>${formatPercent(coin.ath_change_percentage)}</td>
      <td>${formatTime(coin.last_updated)}</td>
    </tr>
  `).join('');
};

const rerender = () => {
  updateSortIndicators();
  updateTabInfo();
  renderCoins(getFilteredCoins());
};

const updateStats = (globalData) => {
  const marketCap = globalData?.total_market_cap?.usd;
  const volume = globalData?.total_volume?.usd;
  const change = globalData?.market_cap_change_percentage_24h_usd;
  const btcDom = globalData?.market_cap_percentage?.btc;

  document.getElementById('market-cap').textContent = formatMoney(marketCap);
  document.getElementById('market-change').innerHTML = formatPercent(change);
  document.getElementById('btc-dominance').innerHTML = `${btcDom?.toFixed(2) ?? '--'}% <span>of total market cap</span>`;
  document.getElementById('market-volume').textContent = formatMoney(volume);
  document.getElementById('volume-progress').style.width = `${Math.max(5, Math.min(100, btcDom ?? 35))}%`;
  document.getElementById('footer-cryptos').textContent = `Cryptos: ${globalData?.active_cryptocurrencies?.toLocaleString('en-US') ?? '--'}`;
  document.getElementById('footer-dominance').textContent = `Dominance: BTC ${btcDom?.toFixed(2) ?? '--'}% ETH ${globalData?.market_cap_percentage?.eth?.toFixed(2) ?? '--'}%`;

  const lastUpdated = new Date().toLocaleTimeString('ru-RU');
  document.getElementById('last-update').textContent = `Обновление: ${lastUpdated}`;
  document.getElementById('total-count').textContent = `Монет: ${allCoins.length}`;
};

const loadData = async () => {
  try {
    coinsBody.innerHTML = '<tr><td colspan="9">Загрузка данных...</td></tr>';

    const [coinsData, globalPayload] = await Promise.all([
      fetchJson('/coins/markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
        price_change_percentage: '1h,24h'
      }),
      fetchJson('/global')
    ]);

    allCoins = coinsData;

    rerender();
    updateStats(globalPayload.data);
  } catch (error) {
    coinsBody.innerHTML = `<tr><td colspan="9">Ошибка загрузки: ${error.message}</td></tr>`;
  }
};

searchInput.addEventListener('input', rerender);

refreshBtn.addEventListener('click', loadData);

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    tabButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    currentTab = button.dataset.tab;
    document.getElementById('tab-info').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    rerender();
  });
});

sortButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.sortKey;
    if (!key) return;

    if (sortState.key === key) {
      sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortState = { key, direction: 'desc' };
    }

    rerender();
  });
});

loadData();
setInterval(loadData, REFRESH_MS);
