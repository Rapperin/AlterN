package com.altern.leaderboard.controller;

import com.altern.leaderboard.dto.GlobalLeaderboardResponse;
import com.altern.leaderboard.dto.ProblemLeaderboardResponse;
import com.altern.leaderboard.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Public ranking and community stats APIs")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @Operation(summary = "Get global leaderboard", description = "Returns the public global user leaderboard.")
    @GetMapping("/api/leaderboard")
    public GlobalLeaderboardResponse getGlobalLeaderboard() {
        return leaderboardService.getGlobalLeaderboard();
    }

    @Operation(summary = "Get problem leaderboard", description = "Returns the best accepted runs for a single problem.")
    @GetMapping("/api/problems/{id}/leaderboard")
    public ProblemLeaderboardResponse getProblemLeaderboard(@PathVariable Long id) {
        return leaderboardService.getProblemLeaderboard(id);
    }
}
