package com.altern.dashboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DashboardBookmarkedProblemResponse {

    private Long problemId;
    private String problemTitle;
    private String difficulty;
    private String status;
    private LocalDateTime bookmarkedAt;
}
