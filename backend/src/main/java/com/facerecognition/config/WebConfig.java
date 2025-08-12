package com.facerecognition.config;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class WebConfig {

    @Bean
    public Module hibernate6Module() {
        return new Hibernate6Module();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors().and()
                .csrf().disable()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/**",
                    "/ws/**",
                    "/persons/register",
                    "/detections/detect",
                    "/persons",
                    "/detections/recent",
                    "/health/**",
                        "persons/{id}/face-data",
                        "/face/detections/camera/**",
                        "/face/detections/person/{personId}",
                        "/face/detections/camera/**",
                        "/face/detections/camera/{cameraId}",
                        "/api/persons",
                        "/api/persons/search",
                        "/api/persons/{id}",
                        "/persons",
                        "/api/persons/register",
                        "/face/detections/person/**",
                        "/api/face/detections/recent",
                        "/api/face/detect",
                        "/persons/register",
                        "/persons/login"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}