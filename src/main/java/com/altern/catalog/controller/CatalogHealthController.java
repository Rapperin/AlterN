package com.altern.catalog.controller;

import com.altern.catalog.dto.CatalogHealthResponse;
import com.altern.catalog.service.CatalogHealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Catalog", description = "Admin catalog health and content quality APIs")
public class CatalogHealthController {

    private final CatalogHealthService catalogHealthService;

    @Operation(summary = "Get catalog health", description = "Returns admin-only catalog coverage and testcase quality metrics.")
    @GetMapping("/api/admin/catalog/health")
    public CatalogHealthResponse getCatalogHealth() {
        return catalogHealthService.getCatalogHealth();
    }
}
