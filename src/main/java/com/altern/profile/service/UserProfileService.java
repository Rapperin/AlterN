package com.altern.profile.service;

import com.altern.achievement.service.AchievementService;
import com.altern.auth.entity.UserAccount;
import com.altern.auth.entity.UserRole;
import com.altern.auth.repository.UserAccountRepository;
import com.altern.auth.security.CurrentUserService;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.profile.dto.UserProfileRecentAcceptedResponse;
import com.altern.profile.dto.UserProfileResponse;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
import com.altern.common.UserProfileNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private static final int RECENT_ACCEPTED_LIMIT = 5;

    private final UserAccountRepository userAccountRepository;
    private final SubmissionRepository submissionRepository;
    private final CurrentUserService currentUserService;
    private final AchievementService achievementService;

    public UserProfileResponse getPublicProfile(String username) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .filter(this::isPublicUser)
                .orElseThrow(() -> new UserProfileNotFoundException(username));
        List<Submission> submissions = submissionRepository.findByUser_Id(user.getId());

        Set<Long> attemptedProblemIds = submissions.stream()
                .map(Submission::getProblem)
                .filter(Objects::nonNull)
                .map(Problem::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        Set<Long> solvedProblemIds = submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(Submission::getProblem)
                .filter(Objects::nonNull)
                .map(Problem::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        RankingSnapshot rankingSnapshot = buildRankingSnapshot();
        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setViewer(currentUserService.findCurrentUser()
                .map(UserAccount::getId)
                .filter(user.getId()::equals)
                .isPresent());
        response.setJoinedAt(user.getCreatedAt());
        response.setGlobalRank(rankingSnapshot.rankByUserId.get(user.getId()));
        response.setTotalRankedUsers(rankingSnapshot.totalRankedUsers);
        response.setSolvedProblems(solvedProblemIds.size());
        response.setAttemptedProblems(attemptedProblemIds.size());
        response.setTotalSubmissions(submissions.size());

        int acceptedSubmissions = (int) submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .count();
        response.setAcceptedSubmissions(acceptedSubmissions);
        response.setAcceptanceRate(submissions.isEmpty()
                ? 0
                : (int) Math.round((acceptedSubmissions * 100.0) / submissions.size()));
        response.setMostUsedLanguage(resolveMostUsedLanguage(buildLanguageBreakdown(submissions)));
        response.setActiveDays((int) submissions.stream()
                .map(this::activityTime)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .distinct()
                .count());

        List<LocalDate> acceptedDays = submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(this::activityTime)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        response.setCurrentAcceptedStreakDays(resolveCurrentAcceptedStreak(acceptedDays));
        response.setLongestAcceptedStreakDays(resolveLongestAcceptedStreak(acceptedDays));
        response.setLastSubmissionAt(submissions.stream()
                .map(this::activityTime)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null));
        response.setLastAcceptedAt(submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(this::activityTime)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null));
        response.setSolvedByDifficulty(buildSolvedByDifficulty(submissions));
        response.setRecentAccepted(buildRecentAccepted(submissions));
        response.setAchievements(achievementService.resolveAchievements(submissions));
        response.setJourney(achievementService.resolveJourney(submissions));
        return response;
    }

    private Map<String, Integer> buildSolvedByDifficulty(List<Submission> submissions) {
        Map<Difficulty, Integer> counts = new EnumMap<>(Difficulty.class);
        for (Difficulty difficulty : Difficulty.values()) {
            counts.put(difficulty, 0);
        }

        Set<Long> countedProblemIds = new HashSet<>();
        for (Submission submission : submissions) {
            if (submission.getStatus() != SubmissionStatus.ACCEPTED
                    || submission.getProblem() == null
                    || submission.getProblem().getId() == null
                    || submission.getProblem().getDifficulty() == null
                    || !countedProblemIds.add(submission.getProblem().getId())) {
                continue;
            }
            counts.merge(submission.getProblem().getDifficulty(), 1, Integer::sum);
        }

        Map<String, Integer> response = new LinkedHashMap<>();
        for (Difficulty difficulty : Difficulty.values()) {
            response.put(difficulty.name(), counts.getOrDefault(difficulty, 0));
        }
        return response;
    }

    private List<UserProfileRecentAcceptedResponse> buildRecentAccepted(List<Submission> submissions) {
        return submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .sorted((left, right) -> compareActivityTimes(right, left))
                .limit(RECENT_ACCEPTED_LIMIT)
                .map(this::toRecentAcceptedResponse)
                .toList();
    }

    private Map<ProgrammingLanguage, Integer> buildLanguageBreakdown(List<Submission> submissions) {
        Map<ProgrammingLanguage, Integer> breakdown = new EnumMap<>(ProgrammingLanguage.class);
        for (Submission submission : submissions) {
            if (submission.getLanguage() == null) {
                continue;
            }
            breakdown.merge(submission.getLanguage(), 1, Integer::sum);
        }
        return breakdown;
    }

    private String resolveMostUsedLanguage(Map<ProgrammingLanguage, Integer> languageBreakdown) {
        return languageBreakdown.entrySet().stream()
                .max(Comparator.<Map.Entry<ProgrammingLanguage, Integer>>comparingInt(Map.Entry::getValue)
                        .thenComparing(entry -> entry.getKey().name()))
                .map(entry -> entry.getKey().name())
                .orElse(null);
    }

    private int resolveCurrentAcceptedStreak(List<LocalDate> acceptedDaysDescending) {
        if (acceptedDaysDescending.isEmpty()) {
            return 0;
        }

        int streak = 1;
        for (int index = 1; index < acceptedDaysDescending.size(); index++) {
            if (acceptedDaysDescending.get(index - 1).minusDays(1).equals(acceptedDaysDescending.get(index))) {
                streak++;
                continue;
            }
            break;
        }
        return streak;
    }

    private int resolveLongestAcceptedStreak(List<LocalDate> acceptedDaysDescending) {
        if (acceptedDaysDescending.isEmpty()) {
            return 0;
        }

        int longest = 1;
        int current = 1;
        for (int index = 1; index < acceptedDaysDescending.size(); index++) {
            if (acceptedDaysDescending.get(index - 1).minusDays(1).equals(acceptedDaysDescending.get(index))) {
                current++;
                longest = Math.max(longest, current);
                continue;
            }
            current = 1;
        }
        return longest;
    }

    private RankingSnapshot buildRankingSnapshot() {
        Map<Long, UserRankingStats> statsByUser = new LinkedHashMap<>();
        for (Submission submission : submissionRepository.findAll()) {
            if (!isPublicSubmission(submission)) {
                continue;
            }

            Long userId = submission.getUser().getId();
            UserRankingStats stats = statsByUser.computeIfAbsent(userId, ignored -> new UserRankingStats(submission.getUser()));
            stats.totalSubmissions++;

            if (submission.getStatus() == SubmissionStatus.ACCEPTED) {
                stats.acceptedSubmissions++;
                if (submission.getProblem() != null && submission.getProblem().getId() != null) {
                    stats.solvedProblemIds.add(submission.getProblem().getId());
                }
                stats.updateRecentAccepted(submission);
            }
        }

        List<UserRankingStats> ranked = statsByUser.values().stream()
                .sorted(this::compareGlobalStats)
                .toList();

        Map<Long, Integer> rankByUserId = new LinkedHashMap<>();
        for (int index = 0; index < ranked.size(); index++) {
            rankByUserId.put(ranked.get(index).user.getId(), index + 1);
        }

        return new RankingSnapshot(rankByUserId, ranked.size());
    }

    private int compareGlobalStats(UserRankingStats left, UserRankingStats right) {
        int solvedCompare = Integer.compare(right.solvedProblems(), left.solvedProblems());
        if (solvedCompare != 0) {
            return solvedCompare;
        }

        int acceptedCompare = Integer.compare(right.acceptedSubmissions, left.acceptedSubmissions);
        if (acceptedCompare != 0) {
            return acceptedCompare;
        }

        int rateCompare = Integer.compare(right.acceptanceRate(), left.acceptanceRate());
        if (rateCompare != 0) {
            return rateCompare;
        }

        LocalDateTime leftRecentAcceptedAt = left.recentAcceptedAt();
        LocalDateTime rightRecentAcceptedAt = right.recentAcceptedAt();
        int recentAcceptedCompare;
        if (leftRecentAcceptedAt == null && rightRecentAcceptedAt == null) {
            recentAcceptedCompare = 0;
        } else if (leftRecentAcceptedAt == null) {
            recentAcceptedCompare = 1;
        } else if (rightRecentAcceptedAt == null) {
            recentAcceptedCompare = -1;
        } else {
            recentAcceptedCompare = rightRecentAcceptedAt.compareTo(leftRecentAcceptedAt);
        }
        if (recentAcceptedCompare != 0) {
            return recentAcceptedCompare;
        }

        return String.CASE_INSENSITIVE_ORDER.compare(left.user.getUsername(), right.user.getUsername());
    }

    private int compareActivityTimes(Submission left, Submission right) {
        LocalDateTime leftTime = activityTime(left);
        LocalDateTime rightTime = activityTime(right);

        if (leftTime == null && rightTime == null) {
            return Long.compare(
                    left.getId() == null ? Long.MIN_VALUE : left.getId(),
                    right.getId() == null ? Long.MIN_VALUE : right.getId()
            );
        }
        if (leftTime == null) {
            return -1;
        }
        if (rightTime == null) {
            return 1;
        }

        int compare = leftTime.compareTo(rightTime);
        if (compare != 0) {
            return compare;
        }

        return Long.compare(
                left.getId() == null ? Long.MIN_VALUE : left.getId(),
                right.getId() == null ? Long.MIN_VALUE : right.getId()
        );
    }

    private LocalDateTime activityTime(Submission submission) {
        return submission.getJudgedAt() != null ? submission.getJudgedAt() : submission.getCreatedAt();
    }

    private UserProfileRecentAcceptedResponse toRecentAcceptedResponse(Submission submission) {
        UserProfileRecentAcceptedResponse response = new UserProfileRecentAcceptedResponse();
        response.setSubmissionId(submission.getId());
        response.setProblemId(submission.getProblem() == null ? null : submission.getProblem().getId());
        response.setProblemTitle(submission.getProblem() == null ? null : submission.getProblem().getTitle());
        response.setLanguage(submission.getLanguage() == null ? null : submission.getLanguage().name());
        response.setAcceptedAt(activityTime(submission));
        response.setExecutionTime(submission.getExecutionTime());
        response.setMemoryUsage(submission.getMemoryUsage());
        return response;
    }

    private boolean isPublicUser(UserAccount user) {
        return user != null && user.getRole() == UserRole.USER;
    }

    private boolean isPublicSubmission(Submission submission) {
        return submission != null && isPublicUser(submission.getUser());
    }

    private record RankingSnapshot(Map<Long, Integer> rankByUserId, int totalRankedUsers) {
    }

    private static final class UserRankingStats {
        private final UserAccount user;
        private final Set<Long> solvedProblemIds = new LinkedHashSet<>();
        private int acceptedSubmissions;
        private int totalSubmissions;
        private LocalDateTime recentAcceptedAt;

        private UserRankingStats(UserAccount user) {
            this.user = user;
        }

        private int solvedProblems() {
            return solvedProblemIds.size();
        }

        private int acceptanceRate() {
            if (totalSubmissions == 0) {
                return 0;
            }
            return (int) Math.round((acceptedSubmissions * 100.0) / totalSubmissions);
        }

        private LocalDateTime recentAcceptedAt() {
            return recentAcceptedAt;
        }

        private void updateRecentAccepted(Submission submission) {
            LocalDateTime nextAcceptedAt = submission.getJudgedAt() != null
                    ? submission.getJudgedAt()
                    : submission.getCreatedAt();

            if (recentAcceptedAt == null || (nextAcceptedAt != null && nextAcceptedAt.isAfter(recentAcceptedAt))) {
                recentAcceptedAt = nextAcceptedAt;
            }
        }
    }
}
