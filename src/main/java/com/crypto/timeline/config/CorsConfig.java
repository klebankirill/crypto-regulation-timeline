package com.crypto.timeline.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${ALLOWED_ORIGINS:*}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        var mapping = registry.addMapping("/**")
                .allowedMethods("*")
                .allowedHeaders("*");

        if (origins.length == 1 && "*".equals(origins[0])) {
            mapping.allowedOriginPatterns("*");
        } else {
            mapping.allowedOrigins(origins).allowCredentials(true);
        }
    }
}
