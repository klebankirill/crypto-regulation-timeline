const table = document.querySelector("#cryptoTable tbody");
const portfolioList = document.getElementById("portfolioList");
const totalValueEl = document.getElementById("totalValue");

let coins = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];

const headers = {
  "x-cg-demo-api-key": "CG-XXXXXXXXXXXXXXXXXXXXXXXX"
};

async function fetchCoins() {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=1h,24h,7d";

  const res = await fetch(url, { headers });
  coins = await res.json();
  renderTable();
  renderPortfolio();
}

function renderTable() {
  table.innerHTML = "";

  coins.forEach((coin, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td onclick="toggleFavorite('${coin.id}')">
        ${favorites.includes(coin.id) ? "⭐" : "☆"}
      </td>
      <td>
        <img src="${coin.image}" width="20">
        ${coin.name}
      </td>
      <td>$${coin.current_price.toLocaleString()}</td>
      <td>$${coin.market_cap.toLocaleString()}</td>
      <td class="${coin.price_change_percentage_1h_in_currency >= 0 ? "green" : "red"}">
        ${coin.price_change_percentage_1h_in_currency?.toFixed(2)}%
      </td>
      <td class="${coin.price_change_percentage_24h >= 0 ? "green" : "red"}">
        ${coin.price_change_percentage_24h?.toFixed(2)}%
      </td>
      <td class="${coin.price_change_percentage_7d_in_currency >= 0 ? "green" : "red"}">
        ${coin.price_change_percentage_7d_in_currency?.toFixed(2)}%
      </td>
    `;

    tr.onclick = () => loadChart(coin.id);
    table.appendChild(tr);
  });
}

function sortBy(type) {
  const map = {
    price: "current_price",
    market_cap: "market_cap",
    change_1h: "price_change_percentage_1h_in_currency",
    change_24h: "price_change_percentage_24h",
    change_7d: "price_change_percentage_7d_in_currency"
  };

  coins.sort((a, b) => b[map[type]] - a[map[type]]);
  renderTable();
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderTable();
}

async function loadChart(id) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`,
    { headers }
  );
  const data = await res.json();

  const labels = data.prices.map(p =>
    new Date(p[0]).toLocaleDateString()
  );
  const prices = data.prices.map(p => p[1]);

  if (window.chart) window.chart.destroy();

  const ctx = document.getElementById("priceChart").getContext("2d");

  window.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: id,
        data: prices,
        borderColor: "#00ffcc",
        fill: false
      }]
    }
  });
}

function addToPortfolio() {
  const coinId = document.getElementById("coinInput").value.toLowerCase();
  const amount = parseFloat(document.getElementById("amountInput").value);

  if (!coinId || !amount) return;

  portfolio.push({ coinId, amount });
  localStorage.setItem("portfolio", JSON.stringify(portfolio));

  renderPortfolio();
}

function renderPortfolio() {
  portfolioList.innerHTML = "";
  let total = 0;

  portfolio.forEach(item => {
    const coin = coins.find(c => c.id === item.coinId);
    if (!coin) return;

    const value = coin.current_price * item.amount;
    total += value;

    const li = document.createElement("li");
    li.textContent = `${coin.name}: ${item.amount} = $${value.toFixed(2)}`;
    portfolioList.appendChild(li);
  });

  totalValueEl.textContent = `Общая стоимость: $${total.toFixed(2)}`;
}

fetchCoins();

setInterval(() => {
  fetchCoins();
}, 180000);
