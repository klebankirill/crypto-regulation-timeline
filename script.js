const table = document.getElementById("cryptoTable");
const searchInput = document.getElementById("search");
const portfolioTable = document.getElementById("portfolioTable");

let coins = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
let chart = null;

// Твои API headers
const headers = {
  "x-cg-demo-api-key": "CG-Hbn4YsqNMrVifvSzqyHAUwK6"
};

// ==================== Fetch coins ====================
async function fetchCoins() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1",
      { headers }
    );

    if (!res.ok) throw new Error("API error");

    coins = await res.json();

    if (!Array.isArray(coins)) return;

    renderCoins(coins);

  } catch (error) {
    console.error("Ошибка загрузки:", error);
    table.innerHTML = `
      <tr>
        <td colspan="6">⚠️ Не удалось загрузить данные</td>
      </tr>
    `;
  }
}

// ==================== Render coins ====================
function renderCoins(data) {
  table.innerHTML = "";
  data.forEach((coin, index) => {
    const changeClass = coin.price_change_percentage_24h > 0 ? "green" : "red";
    const star = favorites.includes(coin.id) ? "⭐" : "☆";

    table.innerHTML += `
      <tr onclick="loadChart('${coin.id}')">
        <td>${index + 1}</td>
        <td class="star" onclick="toggleFavorite(event,'${coin.id}')">${star}</td>
        <td>${coin.name}</td>
        <td>$${coin.current_price}</td>
        <td class="${changeClass}">${coin.price_change_percentage_24h.toFixed(2)}%</td>
        <td>$${coin.market_cap.toLocaleString()}</td>
      </tr>
    `;
  });
}

// ==================== Toggle favorite ====================
function toggleFavorite(e, id) {
  e.stopPropagation();
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderCoins(coins);
}

// ==================== Search ====================
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const filtered = coins.filter(c => c.name.toLowerCase().includes(value));
  renderCoins(filtered);
});

// ==================== Sort ====================
function sortBy(key) {
  coins.sort((a, b) => b[key] - a[key]);
  renderCoins(coins);
}

// ==================== Load chart ====================
async function loadChart(id) {
  try {
    switchTab("market");

    const canvas = document.getElementById("chartCanvas");
    if (!canvas) return;

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`,
      { headers }
    );

    if (!res.ok) throw new Error("Chart API error");

    const data = await res.json();
    if (!data.prices || data.prices.length === 0) return;

    const prices = data.prices.map(p => p[1]);
    const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());

    if (chart) {
      chart.destroy();
      chart = null;
    }

    chart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: id.toUpperCase(),
          data: prices,
          borderWidth: 2,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    setTimeout(() => chart.resize(), 200);

  } catch (error) {
    console.error("Chart error:", error);
  }
}

// ==================== Portfolio ====================
function addToPortfolio() {
  const coin = document.getElementById("coinInput").value.trim().toLowerCase();
  const amount = parseFloat(document.getElementById("amountInput").value);

  if (!coin || isNaN(amount) || amount <= 0) {
    alert("Введите корректные данные");
    return;
  }

  const exists = coins.find(c => c.id === coin);
  if (!exists) {
    alert("Такой монеты нет. Используй id (например: bitcoin)");
    return;
  }

  portfolio.push({ coin, amount });
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  renderPortfolio();
}

async function renderPortfolio() {
  portfolioTable.innerHTML = "";
  let total = 0;

  for (let i = 0; i < portfolio.length; i++) {
    const asset = portfolio[i];

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${asset.coin}&vs_currencies=usd`,
        { headers }
      );
      const data = await res.json();
      const price = data[asset.coin]?.usd || 0;
      const value = price * asset.amount;
      total += value;

      portfolioTable.innerHTML += `
        <tr>
          <td>${asset.coin}</td>
          <td>${asset.amount}</td>
          <td>$${value.toFixed(2)}</td>
          <td><button onclick="removePortfolio(${i})">X</button></td>
        </tr>
      `;
    } catch (error) {
      console.error("Portfolio error:", error);
    }
  }

  document.getElementById("portfolioTotal").innerText =
    "Общая стоимость: $" + total.toFixed(2);
}

function removePortfolio(index) {
  portfolio.splice(index, 1);
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  renderPortfolio();
}

// ==================== Tabs ====================
function switchTab(tab) {
  const market = document.getElementById("marketTab");
  const portfolio = document.getElementById("portfolioTab");

  market.style.display = tab === "market" ? "block" : "none";
  portfolio.style.display = tab === "portfolio" ? "block" : "none";

  if (tab === "market" && chart) {
    setTimeout(() => chart.resize(), 200);
  }
}

// ==================== Theme ====================
function toggleTheme() {
  document.body.classList.toggle("light");
}

// ==================== Home button ====================
function goHome() {
  switchTab('market');
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==================== Init ====================
fetchCoins();
renderPortfolio();
setInterval(fetchCoins, 180000); // каждые 3 минуты
