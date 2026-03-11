package com.altern.leaderboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class GlobalLeaderboardEntryResponse {

    private Integer rank;
    private Long userId;
    private String username;
    private Integer solvedProblems;
    private Integer acceptedSubmissions;
    private Integer totalSubmissions;
    private Integer acceptanceRate;
    private String mostUsedLanguage;
    private Long recentAcceptedProblemId;
    private String recentAcceptedProblemTitle;
    private LocalDateTime recentAcceptedAt;
    private boolean viewer;
}
