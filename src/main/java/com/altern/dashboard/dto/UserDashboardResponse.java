package com.altern.dashboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class UserDashboardResponse {

    private String username;
    private Integer totalProblems;
    private Integer solvedProblems;
    private Integer attemptedProblems;
    private Integer remainingProblems;
    private Integer totalSubmissions;
    private Integer acceptedSubmissions;
    private Integer acceptanceRate;
    private String mostUsedLanguage;
    private Map<String, Integer> languageBreakdown;
    private Map<String, Integer> solvedByDifficulty;
    private DashboardProblemActivityResponse continueAttempt;
    private DashboardProblemActivityResponse suggestedProblem;
    private List<DashboardProblemActivityResponse> recentAttempted;
    private List<DashboardRecentAcceptedResponse> recentAccepted;
}
