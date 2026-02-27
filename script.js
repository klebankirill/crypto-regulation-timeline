const table = document.getElementById("cryptoTable");
const searchInput = document.getElementById("search");
const portfolioTable = document.getElementById("portfolioTable");

let coins = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
let chart = null;

const headers = {
  "x-cg-demo-api-key": "CG-Hbn4YsqNMrVifvSzqyHAUwK6"
};

async function fetchCoins() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=1h,24h,7d",
      { headers }
    );

    if (!res.ok) {
      throw new Error(`Failed to load market data: ${res.status}`);
    }

    coins = await res.json();
    renderCoins(coins);
  } catch (error) {
    console.error(error);
  }
}

function renderCoins(data) {
  table.innerHTML = "";

  data.forEach((coin, index) => {
    const c1 = coin.price_change_percentage_1h_in_currency || 0;
    const c24 = coin.price_change_percentage_24h || 0;
    const c7 = coin.price_change_percentage_7d_in_currency || 0;

    const star = favorites.includes(coin.id) ? "⭐" : "☆";

    table.innerHTML += `
      <tr onclick="loadChart('${coin.id}')">
        <td>${index + 1}</td>
        <td onclick="toggleFavorite(event,'${coin.id}')">${star}</td>
        <td>${coin.name}</td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td>$${coin.market_cap.toLocaleString()}</td>
        <td class="${c1>=0?"green":"red"}">${c1.toFixed(2)}%</td>
        <td class="${c24>=0?"green":"red"}">${c24.toFixed(2)}%</td>
        <td class="${c7>=0?"green":"red"}">${c7.toFixed(2)}%</td>
      </tr>
    `;
  });
}

function toggleFavorite(e,id){
  e.stopPropagation();
  favorites = favorites.includes(id)
    ? favorites.filter(f=>f!==id)
    : [...favorites,id];
  localStorage.setItem("favorites",JSON.stringify(favorites));
  renderCoins(coins);
}

searchInput.addEventListener("input",()=>{
  const val = searchInput.value.toLowerCase();
  renderCoins(coins.filter(c=>c.name.toLowerCase().includes(val)));
});

let sortOrder = {
  price:"desc",
  market_cap:"desc",
  change_1h:"desc",
  change_24h:"desc",
  change_7d:"desc"
};

function updateSortArrows(active){
  ["price","market_cap","change_1h","change_24h","change_7d"]
  .forEach(key=>{
    const el=document.getElementById("sort-"+key);
    if(!el) return;
    el.innerHTML = key===active
      ? (sortOrder[key]==="desc"?" ↓":" ↑")
      : "";
  });
}

function sortBy(key){
  coins.sort((a,b)=>{
    let A,B;
    if(key==="price"){A=a.current_price;B=b.current_price;}
    if(key==="market_cap"){A=a.market_cap;B=b.market_cap;}
    if(key==="change_1h"){A=a.price_change_percentage_1h_in_currency||0;B=b.price_change_percentage_1h_in_currency||0;}
    if(key==="change_24h"){A=a.price_change_percentage_24h||0;B=b.price_change_percentage_24h||0;}
    if(key==="change_7d"){A=a.price_change_percentage_7d_in_currency||0;B=b.price_change_percentage_7d_in_currency||0;}

    return sortOrder[key]==="desc" ? B-A : A-B;
  });

  updateSortArrows(key);
  sortOrder[key]=sortOrder[key]==="desc"?"asc":"desc";
  renderCoins(coins);
}

async function loadChart(id){
  const res=await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`,
    { headers }
  );
  const data=await res.json();
  const prices=data.prices.map(p=>p[1]);
  const labels=data.prices.map(p=>new Date(p[0]).toLocaleDateString());

  if(chart) chart.destroy();

  chart=new Chart(document.getElementById("chartCanvas"),{
    type:"line",
    data:{labels,datasets:[{label:id,data:prices,borderWidth:2,tension:0.3}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

function addToPortfolio(){
  const coin=document.getElementById("coinInput").value.toLowerCase();
  const amount=parseFloat(document.getElementById("amountInput").value);
  if(!coin||!amount) return;

  portfolio.push({coin,amount});
  localStorage.setItem("portfolio",JSON.stringify(portfolio));
  renderPortfolio();
}

async function renderPortfolio(){
  portfolioTable.innerHTML="";
  let total=0;

  for(let i=0;i<portfolio.length;i++){
    const asset=portfolio[i];
    const res=await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${asset.coin}&vs_currencies=usd`,
      { headers }
    );
    const data=await res.json();
    const price=data[asset.coin]?.usd||0;
    const value=price*asset.amount;
    total+=value;

    portfolioTable.innerHTML+=`
      <tr>
        <td>${asset.coin}</td>
        <td>${asset.amount}</td>
        <td>$${value.toFixed(2)}</td>
        <td><button onclick="removePortfolio(${i})">X</button></td>
      </tr>
    `;
  }

  document.getElementById("portfolioTotal").innerText=
    "Общая стоимость: $"+total.toFixed(2);
}

function removePortfolio(i){
  portfolio.splice(i,1);
  localStorage.setItem("portfolio",JSON.stringify(portfolio));
  renderPortfolio();
}

function switchTab(tab){
  document.getElementById("marketTab").style.display=
    tab==="market"?"block":"none";
  document.getElementById("portfolioTab").style.display=
    tab==="portfolio"?"block":"none";
}

function toggleTheme(){
  document.body.classList.toggle("light");
}

function goHome(){
  switchTab("market");
  window.scrollTo({top:0,behavior:"smooth"});
}

fetchCoins();
renderPortfolio();
setInterval(fetchCoins,180000);
