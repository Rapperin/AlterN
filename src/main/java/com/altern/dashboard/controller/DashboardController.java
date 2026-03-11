package com.altern.dashboard.controller;

import com.altern.dashboard.dto.UserDashboardResponse;
import com.altern.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/api/dashboard")
    public UserDashboardResponse getDashboard() {
        return dashboardService.getCurrentUserDashboard();
    }
}
