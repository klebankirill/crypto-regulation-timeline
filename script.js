const coins = [
  { rank: 1, name: 'World Mobile Token', symbol: 'WMTX', price: 0.06949, h1: -0.87, h24: -2.04, cap: '$57.91M', vol: '$115.93M', age: '4y', safe: true },
  { rank: 2, name: 'PAX Gold', symbol: 'PAXG', price: 5318.89, h1: 0.1, h24: 2.09, cap: '$2.52B', vol: '$423.45M', age: '6y', safe: true },
  { rank: 3, name: 'MyNeighborAlice', symbol: 'ALICE', price: 0.1387, h1: 0.08, h24: 27.91, cap: '$13.91M', vol: '$104.31M', age: '4y', safe: true },
  { rank: 4, name: 'NUMINE', symbol: 'NUMI', price: 0.044, h1: -1.2, h24: -2.59, cap: '$8.71M', vol: '$2.56M', age: '10mo', safe: true },
  { rank: 5, name: 'Sign', symbol: 'SIGN', price: 0.03024, h1: 1.82, h24: 26.35, cap: '$49.6M', vol: '$155.56M', age: '10mo', safe: true },
  { rank: 6, name: 'Canton', symbol: 'CC', price: 0.1683, h1: -0.12, h24: -3.81, cap: '$6.37B', vol: '$523.6M', age: '7mo', safe: false }
];

const formatPrice = (value) => {
  const maxDigits = value >= 1 ? 2 : 5;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: maxDigits, minimumFractionDigits: value < 1 ? 4 : 2 })}`;
};

const formatPercent = (value) => {
  const sign = value > 0 ? '▲' : '▼';
  const cls = value > 0 ? 'pos' : 'neg';
  return `<span class="${cls}">${sign} ${Math.abs(value)}%</span>`;
};

const logoColor = ['#f59e0b', '#2b6ef8', '#14b8a6', '#ef4444', '#a855f7', '#111827'];

document.getElementById('coins-body').innerHTML = coins.map((coin, index) => `
  <tr>
    <td>${coin.rank}</td>
    <td>
      <div class="coin">
        <span class="logo" style="background:${logoColor[index % logoColor.length]}">${coin.symbol.slice(0,1)}</span>
        <div>${coin.name} <span style="color:#6a7694;font-weight:500;">${coin.symbol}</span></div>
      </div>
    </td>
    <td>${formatPrice(coin.price)}</td>
    <td>${formatPercent(coin.h1)}</td>
    <td>${formatPercent(coin.h24)}</td>
    <td>${coin.cap}</td>
    <td>${coin.vol}</td>
    <td>${coin.age}</td>
    <td>${coin.safe ? '<span class="security">Safe</span>' : '<span style="color:#9ca3af;">--</span>'}</td>
  </tr>
`).join('');
