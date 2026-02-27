const API_BASE = "https://api.coingecko.com/api/v3";
const MARKET_URL = `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d`;
const STORAGE_KEYS = {
  favorites: "favorites",
  portfolio: "portfolio",
  theme: "theme"
};

const headers = {
  "x-cg-demo-api-key": "CG-Hbn4YsqNMrVifvSzqyHAUwK6"
};

const table = document.getElementById("cryptoTable");
const searchInput = document.getElementById("search");
const portfolioTable = document.getElementById("portfolioTable");
const portfolioTotal = document.getElementById("portfolioTotal");
const marketTab = document.getElementById("marketTab");
const portfolioTab = document.getElementById("portfolioTab");
const themeBtn = document.getElementById("themeBtn");

const sortOrder = {
  price: "desc",
  market_cap: "desc",
  change_1h: "desc",
  change_24h: "desc",
  change_7d: "desc"
};

let coins = [];
let filteredCoins = [];
let favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || [];
let portfolio = JSON.parse(localStorage.getItem(STORAGE_KEYS.portfolio)) || [];
let chart = null;
let chartAbortController = null;
const chartCache = new Map();

const usdCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

function debounce(fn, delay = 300) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light");
  setTheme(isLight ? "dark" : "light");
}

function switchTab(tabName) {
  const isMarket = tabName === "market";
  marketTab.style.display = isMarket ? "block" : "none";
  portfolioTab.style.display = isMarket ? "none" : "block";
}

function goHome() {
  switchTab("market");
  searchInput.value = "";
  filteredCoins = [...coins];
  renderCoins(filteredCoins);
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
}

function savePortfolio() {
  localStorage.setItem(STORAGE_KEYS.portfolio, JSON.stringify(portfolio));
}

function updateSortArrows(activeKey) {
  Object.keys(sortOrder).forEach((key) => {
    const el = document.getElementById(`sort-${key}`);
    if (!el) return;
    el.textContent = key === activeKey ? (sortOrder[key] === "desc" ? "↓" : "↑") : "";
  });
}

function metricByKey(coin, key) {
  switch (key) {
    case "price":
      return coin.current_price || 0;
    case "market_cap":
      return coin.market_cap || 0;
    case "change_1h":
      return coin.price_change_percentage_1h_in_currency || 0;
    case "change_24h":
      return coin.price_change_percentage_24h || 0;
    case "change_7d":
      return coin.price_change_percentage_7d_in_currency || 0;
    default:
      return 0;
  }
}

function sortBy(key) {
  filteredCoins.sort((a, b) => {
    const delta = metricByKey(a, key) - metricByKey(b, key);
    return sortOrder[key] === "desc" ? -delta : delta;
  });

  updateSortArrows(key);
  sortOrder[key] = sortOrder[key] === "desc" ? "asc" : "desc";
  renderCoins(filteredCoins);
}

function renderCoins(data) {
  const rows = data.map((coin, index) => {
    const c1 = coin.price_change_percentage_1h_in_currency || 0;
    const c24 = coin.price_change_percentage_24h || 0;
    const c7 = coin.price_change_percentage_7d_in_currency || 0;
    const star = favorites.includes(coin.id) ? "⭐" : "☆";

    return `
      <tr data-coin-id="${coin.id}">
        <td>${index + 1}</td>
        <td><button class="favorite-btn" data-favorite-id="${coin.id}" aria-label="Избранное">${star}</button></td>
        <td>${coin.name}</td>
        <td>${usdCurrency.format(coin.current_price || 0)}</td>
        <td>${usdCurrency.format(coin.market_cap || 0)}</td>
        <td class="${c1 >= 0 ? "green" : "red"}">${c1.toFixed(2)}%</td>
        <td class="${c24 >= 0 ? "green" : "red"}">${c24.toFixed(2)}%</td>
        <td class="${c7 >= 0 ? "green" : "red"}">${c7.toFixed(2)}%</td>
      </tr>
    `;
  }).join("");

  table.innerHTML = rows || "<tr><td colspan='8'>Нет данных</td></tr>";
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

async function fetchCoins() {
  try {
    coins = await fetchJson(MARKET_URL);
    filteredCoins = [...coins];
    renderCoins(filteredCoins);
  } catch (error) {
    console.error("Ошибка загрузки рынка:", error);
    table.innerHTML = "<tr><td colspan='8'>Не удалось загрузить данные рынка</td></tr>";
  }
}

function toggleFavorite(coinId) {
  if (favorites.includes(coinId)) {
    favorites = favorites.filter((id) => id !== coinId);
  } else {
    favorites.push(coinId);
  }

  saveFavorites();
  renderCoins(filteredCoins);
}

async function loadChart(coinId) {
  try {
    if (chartAbortController) {
      chartAbortController.abort();
    }

    if (!chartCache.has(coinId)) {
      chartAbortController = new AbortController();
      const data = await fetchJson(
        `${API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=7`,
        { signal: chartAbortController.signal }
      );
      chartCache.set(coinId, data.prices);
    }

    const prices = chartCache.get(coinId);
    const labels = prices.map((point) => new Date(point[0]).toLocaleDateString());
    const values = prices.map((point) => point[1]);

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chartCanvas"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: coinId,
          data: values,
          borderWidth: 2,
          borderColor: "#38bdf8",
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки графика:", error);
    }
  }
}

function addToPortfolio() {
  const coinInput = document.getElementById("coinInput");
  const amountInput = document.getElementById("amountInput");

  const coin = coinInput.value.trim().toLowerCase();
  const amount = Number(amountInput.value);

  if (!coin || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  portfolio.push({ coin, amount });
  savePortfolio();
  coinInput.value = "";
  amountInput.value = "";
  renderPortfolio();
}

async function renderPortfolio() {
  if (portfolio.length === 0) {
    portfolioTable.innerHTML = "";
    portfolioTotal.textContent = "Общая стоимость: $0.00";
    return;
  }

  const uniqueCoins = [...new Set(portfolio.map((asset) => asset.coin))];

  try {
    const pricesData = await fetchJson(
      `${API_BASE}/simple/price?ids=${encodeURIComponent(uniqueCoins.join(","))}&vs_currencies=usd`
    );

    let total = 0;
    const rows = portfolio.map((asset, index) => {
      const price = pricesData[asset.coin]?.usd || 0;
      const value = price * asset.amount;
      total += value;

      return `
        <tr>
          <td>${asset.coin}</td>
          <td>${asset.amount}</td>
          <td>${usdCurrency.format(value)}</td>
          <td><button class="remove-btn" data-remove-index="${index}">X</button></td>
        </tr>
      `;
    }).join("");

    portfolioTable.innerHTML = rows;
    portfolioTotal.textContent = `Общая стоимость: ${usdCurrency.format(total)}`;
  } catch (error) {
    console.error("Ошибка загрузки портфеля:", error);
    portfolioTable.innerHTML = "<tr><td colspan='4'>Не удалось загрузить цены портфеля</td></tr>";
  }
}

function removePortfolio(index) {
  portfolio.splice(index, 1);
  savePortfolio();
  renderPortfolio();
}

function setupEventListeners() {
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("logoBtn").addEventListener("click", goHome);
  document.getElementById("addPortfolioBtn").addEventListener("click", addToPortfolio);
  themeBtn.addEventListener("click", toggleTheme);

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => sortBy(th.dataset.sort));
  });

  table.addEventListener("click", (event) => {
    const favoriteBtn = event.target.closest(".favorite-btn");
    if (favoriteBtn) {
      event.stopPropagation();
      toggleFavorite(favoriteBtn.dataset.favoriteId);
      return;
    }

    const row = event.target.closest("tr[data-coin-id]");
    if (row) {
      loadChart(row.dataset.coinId);
    }
  });

  portfolioTable.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".remove-btn");
    if (removeBtn) {
      removePortfolio(Number(removeBtn.dataset.removeIndex));
    }
  });

  const onSearch = debounce((query) => {
    const q = query.trim().toLowerCase();
    filteredCoins = q
      ? coins.filter((coin) => coin.name.toLowerCase().includes(q) || coin.symbol.toLowerCase().includes(q))
      : [...coins];
    renderCoins(filteredCoins);
  }, 250);

  searchInput.addEventListener("input", (event) => onSearch(event.target.value));
}

function bootstrap() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
  setTheme(savedTheme);
  setupEventListeners();
  fetchCoins();
  renderPortfolio();
}

bootstrap();
