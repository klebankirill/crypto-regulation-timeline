const table = document.getElementById("cryptoTable");
const searchInput = document.getElementById("search");
const portfolioTable = document.getElementById("portfolioTable");

let coins = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
let chart = null;

const headers = { "x-cg-demo-api-key": "CG-Hbn4YsqNMrVifvSzqyHAUwK6" };

// ==================== FETCH COINS ====================
async function fetchCoins() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=1h,24h,7d",
      { headers }
    );
    if (!res.ok) throw new Error("API error");

    coins = await res.json();
    renderCoins(coins);
  } catch (err) {
    console.error(err);
    table.innerHTML = `<tr><td colspan="8">⚠️ Не удалось загрузить данные</td></tr>`;
  }
}

// ==================== RENDER COINS ====================
function renderCoins(data) {
  table.innerHTML = "";
  data.forEach((coin, index) => {
    const c1h = coin.price_change_percentage_1h_in_currency || 0;
    const c24h = coin.price_change_percentage_24h || 0;
    const c7d = coin.price_change_percentage_7d_in_currency || 0;

    table.innerHTML += `
      <tr onclick="loadChart('${coin.id}')">
        <td>${index + 1}</td>
        <td class="star" onclick="toggleFavorite(event,'${coin.id}')">${favorites.includes(coin.id) ? '⭐' : '☆'}</td>
        <td>${coin.name}</td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td>$${coin.market_cap.toLocaleString()}</td>
        <td class="${c1h>0?'green':'red'}">${c1h.toFixed(2)}%</td>
        <td class="${c24h>0?'green':'red'}">${c24h.toFixed(2)}%</td>
        <td class="${c7d>0?'green':'red'}">${c7d.toFixed(2)}%</td>
      </tr>
    `;
  });
}

// ==================== FAVORITES ====================
function toggleFavorite(e,id){
  e.stopPropagation();
  favorites.includes(id) ? favorites=favorites.filter(f=>f!==id) : favorites.push(id);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderCoins(coins);
}

// ==================== SEARCH ====================
searchInput.addEventListener("input", ()=>{
  const value = searchInput.value.toLowerCase();
  renderCoins(coins.filter(c=>c.name.toLowerCase().includes(value)));
});

// ==================== SORT WITH ARROWS ====================
let sortOrder = { 
  name: 'asc', 
  price:'desc', 
  market_cap:'desc', 
  change_1h:'desc', 
  change_24h:'desc', 
  change_7d:'desc' 
};

function sortBy(key){
  coins.sort((a,b)=>{
    let vA=0,vB=0;
    switch(key){
      case 'name': vA=a.name.toLowerCase(); vB=b.name.toLowerCase(); break;
      case 'price': vA=a.current_price; vB=b.current_price; break;
      case 'market_cap': vA=a.market_cap; vB=b.market_cap; break;
      case 'change_1h': vA=a.price_change_percentage_1h_in_currency||0; vB=b.price_change_percentage_1h_in_currency||0; break;
      case 'change_24h': vA=a.price_change_percentage_24h||0; vB=b.price_change_percentage_24h||0; break;
      case 'change_7d': vA=a.price_change_percentage_7d_in_currency||0; vB=b.price_change_percentage_7d_in_currency||0; break;
    }
    if(typeof vA==='string') return sortOrder[key]=='asc'? vA.localeCompare(vB) : vB.localeCompare(vA);
    return sortOrder[key]=='desc'? vB-vA : vA-vB;
  });

  updateSortArrows(key);
  sortOrder[key] = sortOrder[key]=='desc'?'asc':'desc';
  renderCoins(coins);
}

function updateSortArrows(activeKey){
  const keys = ['name','price','market_cap','change_1h','change_24h','change_7d'];
  keys.forEach(k=>{
    const span = document.getElementById('sort-'+k);
    if(!span) return;
    if(k===activeKey){
      span.innerHTML = sortOrder[k]=='desc'? ' ↓' : ' ↑';
    } else {
      span.innerHTML = '';
    }
  });
}

// ==================== LOAD CHART ====================
async function loadChart(id){
  try{
    switchTab('market');
    const canvas = document.getElementById("chartCanvas");
    if(!canvas) return;
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`,{headers});
    const data = await res.json();
    const prices = data.prices.map(p=>p[1]);
    const labels = data.prices.map(p=>new Date(p[0]).toLocaleDateString());
    if(chart) chart.destroy();
    chart = new Chart(canvas.getContext("2d"),{
      type:'line',
      data:{labels,datasets:[{label:id.toUpperCase(),data:prices,borderWidth:2,tension:0.3}]},
      options:{responsive:true,maintainAspectRatio:false}
    });
    setTimeout(()=>chart.resize(),200);
  }catch(e){console.error(e);}
}

// ==================== PORTFOLIO ====================
function addToPortfolio(){
  const coin=document.getElementById("coinInput").value.trim().toLowerCase();
  const amount=parseFloat(document.getElementById("amountInput").value);
  if(!coin||isNaN(amount)||amount<=0){alert("Введите корректные данные");return;}
  if(!coins.find(c=>c.id===coin)){alert("Такой монеты нет. Используй id (например: bitcoin)");return;}
  portfolio.push({coin,amount});
  localStorage.setItem("portfolio",JSON.stringify(portfolio));
  renderPortfolio();
}

async function renderPortfolio(){
  portfolioTable.innerHTML='';
  let total=0;
  for(let i=0;i<portfolio.length;i++){
    const asset=portfolio[i];
    try{
      const res=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${asset.coin}&vs_currencies=usd`,{headers});
      const data=await res.json();
      const price=data[asset.coin]?.usd||0;
      const value=price*asset.amount;
      total+=value;
      portfolioTable.innerHTML+=`<tr>
        <td>${asset.coin}</td>
        <td>${asset.amount}</td>
        <td>$${value.toFixed(2)}</td>
        <td><button onclick="removePortfolio(${i})">X</button></td>
      </tr>`;
    }catch(e){console.error(e);}
  }
  document.getElementById("portfolioTotal").innerText="Общая стоимость: $"+total.toFixed(2);
}

function removePortfolio(i){
  portfolio.splice(i,1);
  localStorage.setItem("portfolio",JSON.stringify(portfolio));
  renderPortfolio();
}

// ==================== TABS ====================
function switchTab(tab){
  document.getElementById('marketTab').style.display=tab=='market'?'block':'none';
  document.getElementById('portfolioTab').style.display=tab=='portfolio'?'block':'none';
  if(tab=='market' && chart) setTimeout(()=>chart.resize(),200);
}

// ==================== THEME ====================
function toggleTheme(){document.body.classList.toggle('light');}

// ==================== HOME ====================
function goHome(){switchTab('market');window.scrollTo({top:0,behavior:'smooth'});}

// ==================== INIT ====================
fetchCoins();
renderPortfolio();
setInterval(fetchCoins,180000);
