package com.altern.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@RestController
@Tag(name = "Health", description = "Application health check APIs")
public class HealthController {
    @Operation(summary = "Health check", description = "Returns application health status")
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "UP",
                "application", "AlterN"
        );
    }
}