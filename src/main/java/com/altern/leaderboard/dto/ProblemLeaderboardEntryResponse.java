package com.altern.leaderboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ProblemLeaderboardEntryResponse {

    private Integer rank;
    private Long submissionId;
    private Long userId;
    private String username;
    private String language;
    private Integer executionTime;
    private Integer memoryUsage;
    private LocalDateTime acceptedAt;
    private boolean viewer;
}
