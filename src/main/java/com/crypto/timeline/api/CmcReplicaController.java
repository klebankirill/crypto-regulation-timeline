package com.crypto.timeline.api;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CmcReplicaController {

    @GetMapping(value = "/cmc-replica", produces = MediaType.TEXT_HTML_VALUE)
    public String cmcReplica() {
        return """
                <!doctype html>
                <html lang="ru">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>CMC Replica</title>
                  <style>
                    :root {
                      --text: #111827;
                      --muted: #64748b;
                      --line: #e5e7eb;
                      --blue: #3861fb;
                      --red: #ea3943;
                      --green: #16c784;
                    }
                    * { box-sizing: border-box; }
                    body {
                      margin: 0;
                      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      color: var(--text);
                      background: #fff;
                    }
                    .topbar, .tabs, .filters, .chips {
                      display: flex;
                      align-items: center;
                      gap: 20px;
                      padding: 14px 20px;
                      border-bottom: 1px solid var(--line);
                    }
                    .brand { font-weight: 800; font-size: 28px; letter-spacing: -0.6px; }
                    .nav { display: flex; gap: 18px; font-weight: 600; }
                    .nav a { color: #0f172a; text-decoration: none; font-size: 15px; }
                    .search {
                      margin-left: auto;
                      border: 1px solid var(--line);
                      border-radius: 12px;
                      padding: 10px 14px;
                      width: 220px;
                      color: var(--muted);
                    }
                    .btn {
                      background: var(--blue);
                      color: #fff;
                      border: 0;
                      border-radius: 10px;
                      font-weight: 700;
                      padding: 10px 16px;
                    }
                    .tabs { gap: 30px; font-size: 36px; font-weight: 500; }
                    .tabs .active { color: #111827; border-bottom: 3px solid var(--blue); padding-bottom: 10px; }
                    .cards {
                      padding: 16px 20px;
                      display: grid;
                      grid-template-columns: repeat(5, minmax(0, 1fr));
                      gap: 14px;
                    }
                    .card {
                      border: 1px solid var(--line);
                      border-radius: 16px;
                      padding: 14px;
                      min-height: 108px;
                    }
                    .card h4 { margin: 0 0 8px; font-size: 26px; }
                    .card .value { font-size: 40px; font-weight: 800; }
                    .chips { gap: 10px; overflow: auto; white-space: nowrap; }
                    .chip {
                      border: 1px solid #dbeafe;
                      background: #f8fafc;
                      color: #1e293b;
                      border-radius: 999px;
                      padding: 10px 14px;
                      font-size: 24px;
                    }
                    .filters { font-size: 22px; color: var(--muted); }
                    .filters .active { color: var(--blue); font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td {
                      padding: 16px 14px;
                      border-bottom: 1px solid var(--line);
                      text-align: left;
                      font-size: 21px;
                    }
                    th { color: var(--muted); font-size: 18px; }
                    .name { font-weight: 700; }
                    .sym { color: var(--muted); font-weight: 500; margin-left: 8px; }
                    .buy {
                      border: 2px solid var(--blue);
                      color: var(--blue);
                      border-radius: 999px;
                      padding: 2px 10px;
                      font-size: 15px;
                      font-weight: 700;
                      margin-left: 10px;
                    }
                    .neg { color: var(--red); font-weight: 700; }
                    .pos { color: var(--green); font-weight: 700; }
                    @media (max-width: 1280px) {
                      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                      .topbar, .tabs, .filters, .chips { flex-wrap: wrap; }
                    }
                  </style>
                </head>
                <body>
                  <div class="topbar">
                    <div class="brand">CoinMarketCap</div>
                    <div class="nav">
                      <a href="#">Cryptocurrencies</a>
                      <a href="#">Dashboards</a>
                      <a href="#">DexScan</a>
                      <a href="#">Exchanges</a>
                      <a href="#">Community</a>
                    </div>
                    <input class="search" value="Search" />
                    <button class="btn">Log In</button>
                  </div>

                  <div class="tabs">
                    <span>Top</span>
                    <span class="active">Trending</span>
                    <span>Watchlist</span>
                    <span>Prediction Markets</span>
                    <span>Most Visited</span>
                  </div>

                  <div class="cards">
                    <div class="card"><h4>Market Cap</h4><div class="value">$2.26T <span class="neg">-3.46%</span></div></div>
                    <div class="card"><h4>CMC20</h4><div class="value">$135.16 <span class="neg">-3.76%</span></div></div>
                    <div class="card"><h4>Fear &amp; Greed</h4><div class="value">14 <span style="font-size:24px;color:#64748b">Extreme fear</span></div></div>
                    <div class="card"><h4>Altcoin Season</h4><div class="value">35<span style="font-size:24px;color:#64748b">/100</span></div></div>
                    <div class="card"><h4>Average Crypto RSI</h4><div class="value">44.88</div></div>
                  </div>

                  <div class="chips">
                    <span class="chip">Topic: Bear Altseason</span>
                    <span class="chip">Add AI alert</span>
                    <span class="chip">Inflation and Iran risk drive BTC selloff</span>
                    <span class="chip">Why is the market down today?</span>
                    <span class="chip">Are altcoins outperforming Bitcoin?</span>
                  </div>

                  <div class="filters">
                    <span class="active">All</span><span>1h</span><span>4h</span><span>24h</span><span>Top 200</span><span>Most Traded On-Chain</span>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Name</th><th>Price</th><th>1h %</th><th>24h %</th><th>Market Cap</th><th>Volume (24h)</th><th>Age</th><th>DEX Txns (24h)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>1</td><td class="name">World Mobile Token <span class="sym">WMTX</span><span class="buy">Buy</span></td><td class="neg">$0.06949</td><td class="neg">▼ 0.87%</td><td class="neg">▼ 2.04%</td><td>$57.91M</td><td>$115.93M</td><td>4y</td><td class="pos">138.2K / 138.6K</td></tr>
                      <tr><td>2</td><td class="name">PAX Gold <span class="sym">PAXG</span><span class="buy">Buy</span></td><td>$5,318.89</td><td class="pos">▲ 0.1%</td><td class="pos">▲ 2.09%</td><td>$2.52B</td><td>$423.45M</td><td>6y</td><td class="pos">1,764 / 1,233</td></tr>
                      <tr><td>3</td><td class="name">MyNeighborAlice <span class="sym">ALICE</span><span class="buy">Buy</span></td><td>$0.1387</td><td class="pos">▲ 0.08%</td><td class="pos">▲ 27.91%</td><td>$13.91M</td><td>$104.31M</td><td>4y</td><td class="pos">3,968 / 4,072</td></tr>
                      <tr><td>4</td><td class="name">NUMINE <span class="sym">NUMI</span><span class="buy">Buy</span></td><td>$0.04400</td><td class="neg">▼ 1.2%</td><td class="neg">▼ 2.59%</td><td>$8.71M</td><td>$2.56M</td><td>10mo</td><td class="pos">531 / 122</td></tr>
                      <tr><td>5</td><td class="name">Sign <span class="sym">SIGN</span><span class="buy">Buy</span></td><td class="pos">$0.03024</td><td class="pos">▲ 1.82%</td><td class="pos">▲ 26.35%</td><td>$49.6M</td><td>$155.56M</td><td>10mo</td><td class="pos">2,514 / 2,410</td></tr>
                      <tr><td>6</td><td class="name">Canton <span class="sym">CC</span><span class="buy">Buy</span></td><td>$0.1683</td><td class="neg">▼ 0.12%</td><td class="neg">▼ 3.81%</td><td>$6.37B</td><td>$523.6M</td><td>7mo</td><td>--</td></tr>
                    </tbody>
                  </table>
                </body>
                </html>
                """;
    }
}
