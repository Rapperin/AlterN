package com.altern.dashboard.dto;

import com.altern.achievement.dto.AchievementBadgeResponse;
import com.altern.achievement.dto.JourneyResponse;
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
    private Integer pendingSubmissions;
    private String mostUsedLanguage;
    private String mostSuccessfulLanguage;
    private Integer bookmarkedProblems;
    private Integer activeDays;
    private Integer currentAcceptedStreakDays;
    private Integer longestAcceptedStreakDays;
    private Map<String, Integer> languageBreakdown;
    private Map<String, Integer> acceptedLanguageBreakdown;
    private Map<String, Integer> solvedByDifficulty;
    private DashboardProblemActivityResponse continueAttempt;
    private DashboardProblemActivityResponse suggestedProblem;
    private DashboardJourneyFocusResponse journeyFocus;
    private List<DashboardProblemActivityResponse> recentAttempted;
    private List<DashboardProblemActivityResponse> recentPending;
    private List<DashboardBookmarkedProblemResponse> recentBookmarked;
    private List<DashboardRecentAcceptedResponse> recentAccepted;
    private List<DashboardActivityDayResponse> recentActivity;
    private List<AchievementBadgeResponse> achievements;
    private JourneyResponse journey;
}
