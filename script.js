const table = document.getElementById("cryptoTable");
const searchInput = document.getElementById("search");
const portfolioTable = document.getElementById("portfolioTable");

let coins = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
let chart = null;

// API headers
const headers = {
  "x-cg-demo-api-key": "CG-Hbn4YsqNMrVifvSzqyHAUwK6"
};

// ==================== Fetch coins ====================
async function fetchCoins() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=1h,24h,7d",
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
        <td colspan="8">⚠️ Не удалось загрузить данные</td>
      </tr>
    `;
  }
}

// ==================== Render coins ====================
function renderCoins(data) {
  table.innerHTML = "";
  data.forEach((coin, index) => {
    const change24 = coin.price_change_percentage_24h;
    const change1h = coin.price_change_percentage_1h_in_currency;
    const change7d = coin.price_change_percentage_7d_in_currency;

    const change24Class = change24 > 0 ? "green" : "red";
    const change1hClass = change1h > 0 ? "green" : "red";
    const change7dClass = change7d > 0 ? "green" : "red";

    const star = favorites.includes(coin.id) ? "⭐" : "☆";

    table.innerHTML += `
      <tr onclick="loadChart('${coin.id}')">
        <td>${index + 1}</td>
        <td class="star" onclick="toggleFavorite(event,'${coin.id}')">${star}</td>
        <td>${coin.name}</td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td>$${coin.market_cap.toLocaleString()}</td>
        <td class="${change1hClass}">${change1h?.toFixed(2) ?? "0"}%</td>
        <td class="${change24Class}">${change24?.toFixed(2) ?? "0"}%</td>
        <td class="${change7dClass}">${change7d?.toFixed(2) ?? "0"}%</td>
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

// ==================== Sorting ====================
let sortOrder = {
  price: "desc",
  market_cap: "desc",
  change_1h: "desc",
  change_24h: "desc",
  change_7d: "desc"
};

function sortBy(key) {
  coins.sort((a, b) => {
    let valA, valB;
    switch(key) {
      case "price":
        valA = a.current_price;
        valB = b.current_price;
        break;
      case "market_cap":
        valA = a.market_cap;
        valB = b.market_cap;
        break;
      case "change_1h":
        valA = a.price_change_percentage_1h_in_currency || 0;
        valB = b.price_change_percentage_1h_in_currency || 0;
        break;
      case "change_24h":
        valA = a.price_change_percentage_24h || 0;
        valB = b.price_change_percentage_24h || 0;
        break;
      case "change_7d":
        valA = a.price_change_percentage_7d_in_currency || 0;
        valB = b.price_change_percentage_7d_in_currency || 0;
        break;
      default:
        valA = 0; valB = 0;
    }

    if (sortOrder[key] === "desc") {
      return valB - valA;
    } else {
      return valA - valB;
    }
  });

  // Toggle order
  sortOrder[key] = sortOrder[key] === "desc" ? "asc" : "desc";

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
