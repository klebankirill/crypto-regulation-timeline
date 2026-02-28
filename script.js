const API_BASE = 'https://api.coingecko.com/api/v3';
const REFRESH_MS = 60_000;

const coinsBody = document.getElementById('coins-body');
const searchInput = document.getElementById('search');
const refreshBtn = document.getElementById('refresh-btn');

let allCoins = [];

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

    const [coinsRes, globalRes] = await Promise.all([
      fetch(`${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h,24h`, { cache: 'no-store' }),
      fetch(`${API_BASE}/global`, { cache: 'no-store' })
    ]);

    if (!coinsRes.ok || !globalRes.ok) {
      throw new Error('Не удалось получить данные с API');
    }

    allCoins = await coinsRes.json();
    const globalPayload = await globalRes.json();

    renderCoins(allCoins);
    updateStats(globalPayload.data);
  } catch (error) {
    coinsBody.innerHTML = `<tr><td colspan="9">Ошибка загрузки: ${error.message}</td></tr>`;
  }
};

searchInput.addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  const filtered = allCoins.filter((coin) => {
    return coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query);
  });
  renderCoins(filtered);
});

refreshBtn.addEventListener('click', loadData);

loadData();
setInterval(loadData, REFRESH_MS);
