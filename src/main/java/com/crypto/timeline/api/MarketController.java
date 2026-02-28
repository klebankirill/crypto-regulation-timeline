package com.crypto.timeline.api;

import com.crypto.timeline.service.CoinGeckoService;
import com.crypto.timeline.service.CoinGeckoService.CoinGeckoUnavailableException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
public class MarketController {

    private final CoinGeckoService coinGeckoService;

    public MarketController(CoinGeckoService coinGeckoService) {
        this.coinGeckoService = coinGeckoService;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/api/market-summary")
    public Map<String, Object> marketSummary() {
        JsonNode coins = getCoins();

        double totalCap = 0.0;
        double totalVolume = 0.0;
        double avg24h = 0.0;
        double btcPrice = 0.0;

        for (int i = 0; i < coins.size(); i++) {
            JsonNode coin = coins.get(i);
            totalCap += coin.path("market_cap").asDouble(0.0);
            totalVolume += coin.path("total_volume").asDouble(0.0);

            if (i < 50) {
                avg24h += coin.path("price_change_percentage_24h").asDouble(0.0);
            }

            if ("bitcoin".equals(coin.path("id").asText())) {
                btcPrice = coin.path("current_price").asDouble(0.0);
            }
        }

        avg24h = avg24h / 50.0;
        double fearGreed = Math.max(0.0, Math.min(100.0, 50.0 + avg24h * 2.2));

        Map<String, Object> cards = new HashMap<>();
        cards.put("marketCap", formatCurrencyShort(totalCap));
        cards.put("marketCapChange24h", avg24h);
        cards.put("volume24h", formatCurrencyShort(totalVolume));
        cards.put("btcPrice", btcPrice);
        cards.put("fearGreed", Math.round(fearGreed));

        Map<String, Object> response = new HashMap<>();
        response.put("updatedAt", OffsetDateTime.now().toString());
        response.put("cards", cards);
        return response;
    }

    @GetMapping("/api/trending")
    public Map<String, Object> trending(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "15") int limit
    ) {
        if (limit < 1 || limit > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be between 1 and 100");
        }

        JsonNode coins = getCoins();
        String search = q.trim().toLowerCase(Locale.ROOT);
        List<Map<String, Object>> rows = new ArrayList<>();

        for (JsonNode coin : coins) {
            if (!search.isEmpty()) {
                String name = coin.path("name").asText("").toLowerCase(Locale.ROOT);
                String symbol = coin.path("symbol").asText("").toLowerCase(Locale.ROOT);
                if (!name.contains(search) && !symbol.contains(search)) {
                    continue;
                }
            }

            rows.add(coinRow(coin));
            if (rows.size() == limit) {
                break;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("count", rows.size());
        response.put("rows", rows);
        response.put("chips", List.of(
                "Top 200",
                "Most Traded On-Chain",
                "AI Alert",
                "Market Mood",
                "Security Scan"
        ));
        return response;
    }

    private JsonNode getCoins() {
        try {
            return coinGeckoService.fetchMarketData();
        } catch (CoinGeckoUnavailableException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "CoinGecko is unavailable");
        }
    }

    private Map<String, Object> coinRow(JsonNode coin) {
        Map<String, Object> row = new HashMap<>();
        row.put("rank", coin.path("market_cap_rank").asInt());
        row.put("name", coin.path("name").asText(""));
        row.put("symbol", coin.path("symbol").asText("").toUpperCase(Locale.ROOT));
        row.put("price", coin.path("current_price").asDouble(0.0));
        row.put("change1h", asNullableDouble(coin.path("price_change_percentage_1h_in_currency")));
        row.put("change24h", asNullableDouble(coin.path("price_change_percentage_24h")));
        row.put("change7d", asNullableDouble(coin.path("price_change_percentage_7d_in_currency")));
        row.put("marketCap", coin.path("market_cap").asDouble(0.0));
        row.put("volume24h", coin.path("total_volume").asDouble(0.0));
        row.put("image", coin.path("image").asText(""));
        return row;
    }

    private Double asNullableDouble(JsonNode node) {
        return node.isNumber() ? node.asDouble() : null;
    }

    private String formatCurrencyShort(double value) {
        if (value >= 1_000_000_000_000.0) {
            return String.format(Locale.US, "$%.2fT", value / 1_000_000_000_000.0);
        }
        if (value >= 1_000_000_000.0) {
            return String.format(Locale.US, "$%.2fB", value / 1_000_000_000.0);
        }
        if (value >= 1_000_000.0) {
            return String.format(Locale.US, "$%.2fM", value / 1_000_000.0);
        }
        return String.format(Locale.US, "$%,.2f", value);
    }
}
