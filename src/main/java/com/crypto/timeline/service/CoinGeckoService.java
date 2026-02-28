package com.crypto.timeline.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class CoinGeckoService {
    private static final String MARKET_URL = "https://api.coingecko.com/api/v3/coins/markets"
            + "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
            + "&price_change_percentage=1h,24h,7d";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JsonNode fetchMarketData() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-cg-demo-api-key", "CG-Hbn4YsqNMrVifvSzqyHAUwK6");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    MARKET_URL,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );
            return objectMapper.readTree(response.getBody());
        } catch (RestClientException | java.io.IOException e) {
            throw new CoinGeckoUnavailableException("CoinGecko is unavailable", e);
        }
    }

    public static class CoinGeckoUnavailableException extends RuntimeException {
        public CoinGeckoUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
