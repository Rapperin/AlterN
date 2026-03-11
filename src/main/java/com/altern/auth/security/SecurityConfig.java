package com.altern.auth.security;

import com.altern.common.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getOutputStream(), new ErrorResponse("Authentication required."));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getOutputStream(), new ErrorResponse("Access denied."));
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/styles.css",
                                "/app.js",
                                "/favicon.ico",
                                "/api/health",
                                "/swagger",
                                "/swagger/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/error"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/leaderboard").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/workspace/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/problems/*/testcases/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/problems", "/api/problems/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/problems/*/testcases/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/problems/*/testcases/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/problems/*/testcases/bulk").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/problems/*/testcases").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/problems/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/problems/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/problems/bulk").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/problems").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/submissions").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/submissions", "/api/submissions/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("Password-based UserDetailsService is not used in AlterN.");
        };
    }
}
