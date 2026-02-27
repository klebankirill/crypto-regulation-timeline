let cryptoData = [];
let portfolio = [];
let currentSort = { key: null, asc: true };

function goHome() {
  switchTab('market');
}

function switchTab(tab) {
  document.getElementById("marketTab").style.display =
    tab === "market" ? "block" : "none";

  document.getElementById("portfolioTab").style.display =
    tab === "portfolio" ? "block" : "none";
}

async function loadData() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&price_change_percentage=1h,24h,7d"
  );
  cryptoData = await res.json();
  renderTable();
}

function renderTable() {
  const table = document.getElementById("cryptoTable");
  table.innerHTML = "";

  const search = document.getElementById("search").value.toLowerCase();

  cryptoData
    .filter(c => c.name.toLowerCase().includes(search))
    .forEach(c => {
      table.innerHTML += `
        <tr>
          <td>${c.name}</td>
          <td>$${c.current_price}</td>
          <td class="${c.price_change_percentage_1h_in_currency >= 0 ? "green" : "red"}">
            ${c.price_change_percentage_1h_in_currency?.toFixed(2)}%
          </td>
          <td class="${c.price_change_percentage_24h >= 0 ? "green" : "red"}">
            ${c.price_change_percentage_24h?.toFixed(2)}%
          </td>
          <td class="${c.price_change_percentage_7d_in_currency >= 0 ? "green" : "red"}">
            ${c.price_change_percentage_7d_in_currency?.toFixed(2)}%
          </td>
        </tr>
      `;
    });
}

function sortBy(key) {
  if (currentSort.key === key) {
    currentSort.asc = !currentSort.asc;
  } else {
    currentSort.key = key;
    currentSort.asc = true;
  }

  cryptoData.sort((a, b) => {
    let valA, valB;

    if (key === "name") {
      valA = a.name;
      valB = b.name;
      return currentSort.asc
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (key === "price") {
      valA = a.current_price;
      valB = b.current_price;
    }

    if (key === "change1h") {
      valA = a.price_change_percentage_1h_in_currency;
      valB = b.price_change_percentage_1h_in_currency;
    }

    if (key === "change24h") {
      valA = a.price_change_percentage_24h;
      valB = b.price_change_percentage_24h;
    }

    if (key === "change7d") {
      valA = a.price_change_percentage_7d_in_currency;
      valB = b.price_change_percentage_7d_in_currency;
    }

    return currentSort.asc ? valA - valB : valB - valA;
  });

  renderTable();
}

function addAsset() {
  const coin = document.getElementById("coinInput").value;
  const amount = document.getElementById("amountInput").value;

  if (!coin || !amount) {
    alert("Заполни все поля");
    return;
  }

  portfolio.push({ coin, amount });
  renderPortfolio();

  document.getElementById("coinInput").value = "";
  document.getElementById("amountInput").value = "";
}

function renderPortfolio() {
  const table = document.getElementById("portfolioTable");
  table.innerHTML = "";

  portfolio.forEach(asset => {
    table.innerHTML += `
      <tr>
        <td>${asset.coin}</td>
        <td>${asset.amount}</td>
      </tr>
    `;
  });
}

document.getElementById("search").addEventListener("input", renderTable);

loadData();
