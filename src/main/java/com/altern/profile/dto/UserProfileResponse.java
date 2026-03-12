package com.altern.profile.dto;

import com.altern.achievement.dto.AchievementBadgeResponse;
import com.altern.achievement.dto.JourneyResponse;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class UserProfileResponse {

    private Long userId;
    private String username;
    private boolean viewer;
    private LocalDateTime joinedAt;
    private Integer globalRank;
    private Integer totalRankedUsers;
    private Integer solvedProblems;
    private Integer attemptedProblems;
    private Integer totalSubmissions;
    private Integer acceptedSubmissions;
    private Integer acceptanceRate;
    private String mostUsedLanguage;
    private Integer activeDays;
    private Integer currentAcceptedStreakDays;
    private Integer longestAcceptedStreakDays;
    private LocalDateTime lastSubmissionAt;
    private LocalDateTime lastAcceptedAt;
    private Map<String, Integer> solvedByDifficulty;
    private List<UserProfileRecentAcceptedResponse> recentAccepted;
    private List<AchievementBadgeResponse> achievements;
    private JourneyResponse journey;
}
