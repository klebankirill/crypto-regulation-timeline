const table = document.getElementById("cryptoTable");
const searchInput = document.getElementById("search");
const portfolioTable = document.getElementById("portfolioTable");

let coins = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
let chart = null;

async function fetchCoins() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1"
    );

    if (!res.ok) throw new Error("API error");

    coins = await res.json();

    if (!Array.isArray(coins)) return;

    render(coins);

  } catch (error) {
    console.error("Ошибка загрузки:", error);
    table.innerHTML = `
      <tr>
        <td colspan="6">⚠️ Не удалось загрузить данные</td>
      </tr>
    `;
  }
}

function render(data) {
  table.innerHTML = "";
  data.forEach((coin, index) => {
    const changeClass =
      coin.price_change_percentage_24h > 0 ? "green" : "red";

    const star = favorites.includes(coin.id) ? "⭐" : "☆";

    table.innerHTML += `
      <tr onclick="loadChart('${coin.id}')">
        <td>${index + 1}</td>
        <td class="star" onclick="toggleFavorite(event,'${coin.id}')">${star}</td>
        <td>${coin.name}</td>
        <td>$${coin.current_price}</td>
        <td class="${changeClass}">
          ${coin.price_change_percentage_24h.toFixed(2)}%
        </td>
        <td>$${coin.market_cap.toLocaleString()}</td>
      </tr>
    `;
  });
}

function toggleFavorite(e, id) {
  e.stopPropagation();
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  render(coins);
}

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(value)
  );
  render(filtered);
});

function sortBy(key) {
  coins.sort((a, b) => b[key] - a[key]);
  render(coins);
}

async function loadChart(id) {
  try {
    const canvas = document.getElementById("chartCanvas");
    if (!canvas) return;

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
    );

    if (!res.ok) throw new Error("Chart API error");

    const data = await res.json();

    if (!data.prices) return;

    const prices = data.prices.map(p => p[1]);
    const labels = data.prices.map(p =>
      new Date(p[0]).toLocaleDateString()
    );

    if (chart instanceof Chart) {
      chart.destroy();
    }

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: id.toUpperCase(),
          data: prices,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

  } catch (error) {
    console.error("Chart error:", error);
  }
}

function addToPortfolio() {
  const coin = document.getElementById("coinInput").value;
  const amount = parseFloat(document.getElementById("amountInput").value);

  portfolio.push({ coin, amount });
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  renderPortfolio();
}

function renderPortfolio() {
  portfolioTable.innerHTML = "";
  let total = 0;

  portfolio.forEach(async (asset, index) => {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${asset.coin}&vs_currencies=usd`
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
        <td><button onclick="removePortfolio(${index})">X</button></td>
      </tr>
    `;

    document.getElementById("portfolioTotal").innerText =
      "Общая стоимость: $" + total.toFixed(2);
  });
}

function removePortfolio(i) {
  portfolio.splice(i, 1);
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  renderPortfolio();
}

function switchTab(tab) {
  document.getElementById("marketTab").style.display =
    tab === "market" ? "block" : "none";
  document.getElementById("portfolioTab").style.display =
    tab === "portfolio" ? "block" : "none";
}

function toggleTheme() {
  document.body.classList.toggle("light");
}

fetchCoins();
renderPortfolio();
setInterval(fetchCoins, 60000);

}
function goHome() {
  switchTab('market');
  window.scrollTo({ top: 0, behavior: "smooth" });
}
