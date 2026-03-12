package com.altern.dashboard.service;

import com.altern.achievement.dto.JourneyGoalResponse;
import com.altern.achievement.dto.JourneyResponse;
import com.altern.achievement.service.AchievementService;
import com.altern.auth.entity.UserAccount;
import com.altern.auth.security.CurrentUserService;
import com.altern.bookmark.entity.ProblemBookmark;
import com.altern.bookmark.repository.ProblemBookmarkRepository;
import com.altern.dashboard.dto.DashboardActivityDayResponse;
import com.altern.dashboard.dto.DashboardBookmarkedProblemResponse;
import com.altern.dashboard.dto.DashboardJourneyFocusResponse;
import com.altern.dashboard.dto.DashboardProblemActivityResponse;
import com.altern.dashboard.dto.DashboardRecentAcceptedResponse;
import com.altern.dashboard.dto.UserDashboardResponse;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int RECENT_ACCEPTED_LIMIT = 5;
    private static final int RECENT_ACTIVITY_DAYS = 14;

    private final CurrentUserService currentUserService;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemBookmarkRepository problemBookmarkRepository;
    private final AchievementService achievementService;

    public UserDashboardResponse getCurrentUserDashboard() {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        List<Problem> problems = problemRepository.findAll();
        List<Submission> submissions = submissionRepository.findByUser_Id(currentUser.getId());
        List<ProblemBookmark> bookmarks = problemBookmarkRepository.findByUser_IdOrderByCreatedAtDesc(currentUser.getId());
        Map<Long, Submission> latestSubmissionByProblemId = buildLatestSubmissionByProblemId(submissions);

        Set<Long> attemptedProblemIds = submissions.stream()
                .map(Submission::getProblem)
                .filter(problem -> problem != null && problem.getId() != null)
                .map(Problem::getId)
                .collect(Collectors.toSet());

        Set<Long> solvedProblemIds = submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(Submission::getProblem)
                .filter(problem -> problem != null && problem.getId() != null)
                .map(Problem::getId)
                .collect(Collectors.toSet());
        Set<Long> bookmarkedProblemIds = bookmarks.stream()
                .map(ProblemBookmark::getProblem)
                .filter(problem -> problem != null && problem.getId() != null)
                .map(Problem::getId)
                .collect(Collectors.toSet());

        UserDashboardResponse response = new UserDashboardResponse();
        response.setUsername(currentUser.getUsername());
        response.setTotalProblems(problems.size());
        response.setSolvedProblems(solvedProblemIds.size());
        response.setAttemptedProblems(attemptedProblemIds.size());
        response.setRemainingProblems(Math.max(problems.size() - solvedProblemIds.size(), 0));
        response.setTotalSubmissions(submissions.size());

        int acceptedSubmissions = (int) submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .count();
        int pendingSubmissions = (int) submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.PENDING)
                .count();
        response.setAcceptedSubmissions(acceptedSubmissions);
        response.setAcceptanceRate(submissions.isEmpty()
                ? 0
                : (int) Math.round((acceptedSubmissions * 100.0) / submissions.size()));
        response.setPendingSubmissions(pendingSubmissions);
        response.setLanguageBreakdown(buildLanguageBreakdown(submissions));
        response.setAcceptedLanguageBreakdown(buildAcceptedLanguageBreakdown(submissions));
        response.setMostUsedLanguage(resolveMostUsedLanguage(response.getLanguageBreakdown()));
        response.setMostSuccessfulLanguage(resolveMostSuccessfulLanguage(
                response.getLanguageBreakdown(),
                response.getAcceptedLanguageBreakdown()
        ));
        response.setBookmarkedProblems(bookmarkedProblemIds.size());
        response.setActiveDays((int) submissions.stream()
                .map(this::activityTime)
                .filter(java.util.Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .distinct()
                .count());
        List<LocalDate> acceptedDays = submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(this::activityTime)
                .filter(java.util.Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();
        response.setCurrentAcceptedStreakDays(resolveCurrentAcceptedStreak(acceptedDays));
        response.setLongestAcceptedStreakDays(resolveLongestAcceptedStreak(acceptedDays));
        response.setSolvedByDifficulty(buildSolvedByDifficulty(problems, solvedProblemIds));
        List<DashboardProblemActivityResponse> recentAttempted = buildRecentAttempted(submissions, solvedProblemIds);
        response.setContinueAttempt(recentAttempted.isEmpty() ? null : recentAttempted.get(0));
        response.setRecentAttempted(recentAttempted);
        response.setRecentPending(buildRecentPending(submissions));
        response.setSuggestedProblem(buildSuggestedProblem(
                problems,
                bookmarks,
                solvedProblemIds,
                attemptedProblemIds,
                bookmarkedProblemIds,
                recentAttempted
        ));
        response.setRecentBookmarked(buildRecentBookmarked(bookmarks, solvedProblemIds, latestSubmissionByProblemId));
        response.setRecentAccepted(buildRecentAccepted(submissions));
        response.setRecentActivity(buildRecentActivity(submissions));
        response.setAchievements(achievementService.resolveAchievements(submissions));
        JourneyResponse journey = achievementService.resolveJourney(submissions);
        response.setJourney(journey);
        response.setJourneyFocus(buildJourneyFocus(
                problems,
                bookmarks,
                submissions,
                solvedProblemIds,
                attemptedProblemIds,
                bookmarkedProblemIds,
                recentAttempted,
                journey
        ));
        return response;
    }

    private Map<String, Integer> buildLanguageBreakdown(List<Submission> submissions) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        for (ProgrammingLanguage language : ProgrammingLanguage.values()) {
            breakdown.put(language.name(), 0);
        }

        for (Submission submission : submissions) {
            if (submission.getLanguage() == null) {
                continue;
            }
            breakdown.merge(submission.getLanguage().name(), 1, Integer::sum);
        }

        return breakdown;
    }

    private String resolveMostUsedLanguage(Map<String, Integer> languageBreakdown) {
        return languageBreakdown.entrySet().stream()
                .max(Comparator.<Map.Entry<String, Integer>>comparingInt(Map.Entry::getValue)
                        .thenComparing(Map.Entry::getKey))
                .filter(entry -> entry.getValue() > 0)
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private Map<String, Integer> buildAcceptedLanguageBreakdown(List<Submission> submissions) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        for (ProgrammingLanguage language : ProgrammingLanguage.values()) {
            breakdown.put(language.name(), 0);
        }

        for (Submission submission : submissions) {
            if (submission.getLanguage() == null || submission.getStatus() != SubmissionStatus.ACCEPTED) {
                continue;
            }
            breakdown.merge(submission.getLanguage().name(), 1, Integer::sum);
        }

        return breakdown;
    }

    private String resolveMostSuccessfulLanguage(
            Map<String, Integer> languageBreakdown,
            Map<String, Integer> acceptedLanguageBreakdown
    ) {
        return acceptedLanguageBreakdown.entrySet().stream()
                .filter(entry -> entry.getValue() > 0)
                .max((left, right) -> {
                    double leftRate = acceptanceRateForLanguage(left.getKey(), languageBreakdown, acceptedLanguageBreakdown);
                    double rightRate = acceptanceRateForLanguage(right.getKey(), languageBreakdown, acceptedLanguageBreakdown);

                    int byRate = Double.compare(leftRate, rightRate);
                    if (byRate != 0) {
                        return byRate;
                    }

                    int byAcceptedCount = Integer.compare(left.getValue(), right.getValue());
                    if (byAcceptedCount != 0) {
                        return byAcceptedCount;
                    }

                    return right.getKey().compareTo(left.getKey());
                })
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private double acceptanceRateForLanguage(
            String language,
            Map<String, Integer> languageBreakdown,
            Map<String, Integer> acceptedLanguageBreakdown
    ) {
        int total = Math.max(languageBreakdown.getOrDefault(language, 0), 0);
        int accepted = Math.max(acceptedLanguageBreakdown.getOrDefault(language, 0), 0);
        if (total == 0) {
            return 0;
        }
        return accepted / (double) total;
    }

    private Map<String, Integer> buildSolvedByDifficulty(List<Problem> problems, Set<Long> solvedProblemIds) {
        Map<Difficulty, Integer> counts = new EnumMap<>(Difficulty.class);
        for (Difficulty difficulty : Difficulty.values()) {
            counts.put(difficulty, 0);
        }

        for (Problem problem : problems) {
            if (problem.getId() == null || problem.getDifficulty() == null || !solvedProblemIds.contains(problem.getId())) {
                continue;
            }
            counts.merge(problem.getDifficulty(), 1, Integer::sum);
        }

        Map<String, Integer> response = new LinkedHashMap<>();
        for (Difficulty difficulty : Difficulty.values()) {
            response.put(difficulty.name(), counts.getOrDefault(difficulty, 0));
        }
        return response;
    }

    private List<DashboardRecentAcceptedResponse> buildRecentAccepted(List<Submission> submissions) {
        return submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .sorted((left, right) -> compareActivityTimes(right, left))
                .limit(RECENT_ACCEPTED_LIMIT)
                .map(this::toRecentAcceptedResponse)
                .toList();
    }

    private List<DashboardActivityDayResponse> buildRecentActivity(List<Submission> submissions) {
        Map<LocalDate, DashboardActivityDayResponse> activityByDay = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();

        for (int offset = RECENT_ACTIVITY_DAYS - 1; offset >= 0; offset--) {
            LocalDate date = today.minusDays(offset);
            DashboardActivityDayResponse entry = new DashboardActivityDayResponse();
            entry.setDate(date);
            entry.setSubmissions(0);
            entry.setAccepted(0);
            activityByDay.put(date, entry);
        }

        for (Submission submission : submissions) {
            LocalDateTime activityTime = activityTime(submission);
            if (activityTime == null) {
                continue;
            }

            DashboardActivityDayResponse entry = activityByDay.get(activityTime.toLocalDate());
            if (entry == null) {
                continue;
            }

            entry.setSubmissions(entry.getSubmissions() + 1);
            if (submission.getStatus() == SubmissionStatus.ACCEPTED) {
                entry.setAccepted(entry.getAccepted() + 1);
            }
        }

        return List.copyOf(activityByDay.values());
    }

    private List<DashboardProblemActivityResponse> buildRecentAttempted(
            List<Submission> submissions,
            Set<Long> solvedProblemIds
    ) {
        Map<Long, Submission> latestByProblem = new LinkedHashMap<>();

        submissions.stream()
                .filter(submission -> submission.getProblem() != null && submission.getProblem().getId() != null)
                .filter(submission -> !solvedProblemIds.contains(submission.getProblem().getId()))
                .filter(submission -> submission.getStatus() != null && submission.getStatus() != SubmissionStatus.PENDING)
                .sorted((left, right) -> compareActivityTimes(right, left))
                .forEach(submission -> latestByProblem.putIfAbsent(submission.getProblem().getId(), submission));

        return latestByProblem.values().stream()
                .limit(3)
                .map(this::toProblemActivityResponse)
                .toList();
    }

    private List<DashboardProblemActivityResponse> buildRecentPending(List<Submission> submissions) {
        Map<Long, Submission> latestPendingByProblem = new LinkedHashMap<>();

        submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.PENDING)
                .filter(submission -> submission.getProblem() != null && submission.getProblem().getId() != null)
                .sorted((left, right) -> compareActivityTimes(right, left))
                .forEach(submission -> latestPendingByProblem.putIfAbsent(submission.getProblem().getId(), submission));

        return latestPendingByProblem.values().stream()
                .limit(3)
                .map(this::toProblemActivityResponse)
                .toList();
    }

    private DashboardProblemActivityResponse buildSuggestedProblem(
            List<Problem> problems,
            List<ProblemBookmark> bookmarks,
            Set<Long> solvedProblemIds,
            Set<Long> attemptedProblemIds,
            Set<Long> bookmarkedProblemIds,
            List<DashboardProblemActivityResponse> recentAttempted
    ) {
        Set<Long> excludedProblemIds = new HashSet<>();
        recentAttempted.stream()
                .findFirst()
                .map(DashboardProblemActivityResponse::getProblemId)
                .ifPresent(excludedProblemIds::add);

        Problem suggestedBookmarked = bookmarks.stream()
                .map(ProblemBookmark::getProblem)
                .filter(problem -> problem != null && problem.getId() != null)
                .filter(problem -> !solvedProblemIds.contains(problem.getId()))
                .filter(problem -> !excludedProblemIds.contains(problem.getId()))
                .findFirst()
                .orElse(null);

        if (suggestedBookmarked != null) {
            return toSuggestedProblemResponse(suggestedBookmarked, attemptedProblemIds, bookmarkedProblemIds);
        }

        List<Problem> remaining = problems.stream()
                .filter(problem -> problem.getId() != null && !solvedProblemIds.contains(problem.getId()))
                .sorted(Comparator
                        .comparing((Problem problem) -> attemptedProblemIds.contains(problem.getId()))
                        .thenComparing(problem -> difficultyOrder(problem.getDifficulty()))
                        .thenComparing(Problem::getTitle, String.CASE_INSENSITIVE_ORDER))
                .toList();

        Problem suggested = remaining.stream()
                .filter(problem -> !excludedProblemIds.contains(problem.getId()))
                .findFirst()
                .orElse(remaining.isEmpty() ? null : remaining.get(0));

        if (suggested == null) {
            return null;
        }

        return toSuggestedProblemResponse(suggested, attemptedProblemIds, bookmarkedProblemIds);
    }

    private DashboardJourneyFocusResponse buildJourneyFocus(
            List<Problem> problems,
            List<ProblemBookmark> bookmarks,
            List<Submission> submissions,
            Set<Long> solvedProblemIds,
            Set<Long> attemptedProblemIds,
            Set<Long> bookmarkedProblemIds,
            List<DashboardProblemActivityResponse> recentAttempted,
            JourneyResponse journey
    ) {
        if (journey == null || journey.getNextGoals() == null || journey.getNextGoals().isEmpty()) {
            return null;
        }

        JourneyGoalResponse primaryGoal = journey.getNextGoals().get(0);
        if (primaryGoal == null || primaryGoal.getCode() == null) {
            return null;
        }

        return switch (primaryGoal.getCode()) {
            case "HARD_SOLVER" -> buildFocusForHardSolver(
                    primaryGoal,
                    problems,
                    bookmarks,
                    solvedProblemIds,
                    attemptedProblemIds,
                    bookmarkedProblemIds
            );
            case "COMEBACK" -> buildFocusForComeback(primaryGoal, recentAttempted);
            case "POLYGLOT" -> buildFocusForPolyglot(primaryGoal, submissions, attemptedProblemIds, bookmarkedProblemIds);
            case "FIRST_ACCEPTED", "FIVE_SOLVED", "STREAK_3" -> buildFocusForGeneralProgress(
                    primaryGoal,
                    problems,
                    bookmarks,
                    solvedProblemIds,
                    attemptedProblemIds,
                    bookmarkedProblemIds
            );
            default -> null;
        };
    }

    private DashboardJourneyFocusResponse buildFocusForHardSolver(
            JourneyGoalResponse goal,
            List<Problem> problems,
            List<ProblemBookmark> bookmarks,
            Set<Long> solvedProblemIds,
            Set<Long> attemptedProblemIds,
            Set<Long> bookmarkedProblemIds
    ) {
        Problem candidate = bookmarks.stream()
                .map(ProblemBookmark::getProblem)
                .filter(problem -> problem != null && problem.getId() != null)
                .filter(problem -> problem.getDifficulty() == Difficulty.HARD)
                .filter(problem -> !solvedProblemIds.contains(problem.getId()))
                .findFirst()
                .orElseGet(() -> problems.stream()
                        .filter(problem -> problem.getId() != null)
                        .filter(problem -> problem.getDifficulty() == Difficulty.HARD)
                        .filter(problem -> !solvedProblemIds.contains(problem.getId()))
                        .sorted(Comparator
                                .comparing((Problem problem) -> !attemptedProblemIds.contains(problem.getId()))
                                .thenComparing(Problem::getTitle, String.CASE_INSENSITIVE_ORDER))
                        .findFirst()
                        .orElse(null));

        if (candidate == null) {
            return null;
        }

        return toJourneyFocusResponse(
                candidate,
                goal,
                attemptedProblemIds,
                bookmarkedProblemIds,
                "Hard Things icin siradaki aday bu hard problem."
        );
    }

    private DashboardJourneyFocusResponse buildFocusForComeback(
            JourneyGoalResponse goal,
            List<DashboardProblemActivityResponse> recentAttempted
    ) {
        if (recentAttempted.isEmpty()) {
            return null;
        }

        DashboardProblemActivityResponse attempt = recentAttempted.get(0);
        DashboardJourneyFocusResponse response = new DashboardJourneyFocusResponse();
        response.setProblemId(attempt.getProblemId());
        response.setProblemTitle(attempt.getProblemTitle());
        response.setDifficulty(attempt.getDifficulty());
        response.setStatus(attempt.getStatus());
        response.setGoalCode(goal.getCode());
        response.setGoalTitle(goal.getTitle());
        response.setReason("Comeback icin en son takildigin problemi yeniden dene.");
        response.setSuggestedLanguage(attempt.getLanguage());
        return response;
    }

    private DashboardJourneyFocusResponse buildFocusForPolyglot(
            JourneyGoalResponse goal,
            List<Submission> submissions,
            Set<Long> attemptedProblemIds,
            Set<Long> bookmarkedProblemIds
    ) {
        Map<Long, Problem> acceptedProblemsById = new LinkedHashMap<>();
        Map<Long, Set<ProgrammingLanguage>> acceptedLanguagesByProblemId = new LinkedHashMap<>();

        submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .filter(submission -> submission.getProblem() != null && submission.getProblem().getId() != null)
                .forEach(submission -> {
                    Long problemId = submission.getProblem().getId();
                    acceptedProblemsById.putIfAbsent(problemId, submission.getProblem());
                    if (submission.getLanguage() != null) {
                        acceptedLanguagesByProblemId
                                .computeIfAbsent(problemId, ignored -> EnumSet.noneOf(ProgrammingLanguage.class))
                                .add(submission.getLanguage());
                    }
                });

        Problem candidate = acceptedProblemsById.values().stream()
                .sorted(Comparator
                        .comparingInt((Problem problem) -> acceptedLanguagesByProblemId
                                .getOrDefault(problem.getId(), Set.of())
                                .size())
                        .thenComparing(problem -> difficultyOrder(problem.getDifficulty()))
                        .thenComparing(Problem::getTitle, String.CASE_INSENSITIVE_ORDER))
                .findFirst()
                .orElse(null);

        if (candidate == null) {
            return null;
        }

        Set<ProgrammingLanguage> usedLanguages = acceptedLanguagesByProblemId.getOrDefault(candidate.getId(), Set.of());
        ProgrammingLanguage suggestedLanguage = resolveSuggestedPolyglotLanguage(usedLanguages);
        DashboardJourneyFocusResponse response = toJourneyFocusResponse(
                candidate,
                goal,
                attemptedProblemIds,
                bookmarkedProblemIds,
                "Polyglot icin tanidik bir problemi yeni bir dilde tekrar cozmeyi dene."
        );
        response.setSuggestedLanguage(suggestedLanguage == null ? null : suggestedLanguage.name());
        return response;
    }

    private DashboardJourneyFocusResponse buildFocusForGeneralProgress(
            JourneyGoalResponse goal,
            List<Problem> problems,
            List<ProblemBookmark> bookmarks,
            Set<Long> solvedProblemIds,
            Set<Long> attemptedProblemIds,
            Set<Long> bookmarkedProblemIds
    ) {
        Problem candidate = bookmarks.stream()
                .map(ProblemBookmark::getProblem)
                .filter(problem -> problem != null && problem.getId() != null)
                .filter(problem -> !solvedProblemIds.contains(problem.getId()))
                .findFirst()
                .orElseGet(() -> problems.stream()
                        .filter(problem -> problem.getId() != null)
                        .filter(problem -> !solvedProblemIds.contains(problem.getId()))
                        .sorted(Comparator
                                .comparing((Problem problem) -> attemptedProblemIds.contains(problem.getId()))
                                .thenComparing(problem -> difficultyOrder(problem.getDifficulty()))
                                .thenComparing(Problem::getTitle, String.CASE_INSENSITIVE_ORDER))
                        .findFirst()
                        .orElse(null));

        if (candidate == null) {
            return null;
        }

        String reason = switch (goal.getCode()) {
            case "FIRST_ACCEPTED" -> "Ilk accepted icin en uygun baslangic problemlerinden biri.";
            case "FIVE_SOLVED" -> "Next level icin solved sayini buyutecek uygun aday.";
            case "STREAK_3" -> "Accepted serini surdurmek icin iyi bir siradaki problem.";
            default -> "Journey ilerlemeni destekleyecek siradaki problem.";
        };

        return toJourneyFocusResponse(candidate, goal, attemptedProblemIds, bookmarkedProblemIds, reason);
    }

    private DashboardJourneyFocusResponse toJourneyFocusResponse(
            Problem problem,
            JourneyGoalResponse goal,
            Set<Long> attemptedProblemIds,
            Set<Long> bookmarkedProblemIds,
            String reason
    ) {
        DashboardJourneyFocusResponse response = new DashboardJourneyFocusResponse();
        response.setProblemId(problem.getId());
        response.setProblemTitle(problem.getTitle());
        response.setDifficulty(problem.getDifficulty() == null ? null : problem.getDifficulty().name());
        response.setStatus(attemptedProblemIds.contains(problem.getId())
                ? "ATTEMPTED"
                : bookmarkedProblemIds.contains(problem.getId()) ? "BOOKMARKED" : "NOT_STARTED");
        response.setGoalCode(goal.getCode());
        response.setGoalTitle(goal.getTitle());
        response.setReason(reason);
        return response;
    }

    private ProgrammingLanguage resolveSuggestedPolyglotLanguage(Set<ProgrammingLanguage> usedLanguages) {
        for (ProgrammingLanguage language : ProgrammingLanguage.values()) {
            if (!usedLanguages.contains(language)) {
                return language;
            }
        }
        return null;
    }

    private DashboardProblemActivityResponse toSuggestedProblemResponse(
            Problem suggested,
            Set<Long> attemptedProblemIds,
            Set<Long> bookmarkedProblemIds
    ) {
        DashboardProblemActivityResponse response = new DashboardProblemActivityResponse();
        response.setProblemId(suggested.getId());
        response.setProblemTitle(suggested.getTitle());
        response.setDifficulty(suggested.getDifficulty() == null ? null : suggested.getDifficulty().name());
        response.setStatus(attemptedProblemIds.contains(suggested.getId())
                ? "ATTEMPTED"
                : bookmarkedProblemIds.contains(suggested.getId()) ? "BOOKMARKED" : "NOT_STARTED");
        return response;
    }

    private List<DashboardBookmarkedProblemResponse> buildRecentBookmarked(
            List<ProblemBookmark> bookmarks,
            Set<Long> solvedProblemIds,
            Map<Long, Submission> latestSubmissionByProblemId
    ) {
        return bookmarks.stream()
                .filter(bookmark -> bookmark.getProblem() != null && bookmark.getProblem().getId() != null)
                .limit(5)
                .map(bookmark -> toBookmarkedProblemResponse(bookmark, solvedProblemIds, latestSubmissionByProblemId))
                .toList();
    }

    private DashboardBookmarkedProblemResponse toBookmarkedProblemResponse(
            ProblemBookmark bookmark,
            Set<Long> solvedProblemIds,
            Map<Long, Submission> latestSubmissionByProblemId
    ) {
        Problem problem = bookmark.getProblem();
        Long problemId = problem == null ? null : problem.getId();
        Submission latestSubmission = problemId == null ? null : latestSubmissionByProblemId.get(problemId);

        DashboardBookmarkedProblemResponse response = new DashboardBookmarkedProblemResponse();
        response.setProblemId(problemId);
        response.setProblemTitle(problem == null ? null : problem.getTitle());
        response.setDifficulty(problem == null || problem.getDifficulty() == null ? null : problem.getDifficulty().name());
        response.setBookmarkedAt(bookmark.getCreatedAt());
        response.setStatus(problemId != null && solvedProblemIds.contains(problemId)
                ? SubmissionStatus.ACCEPTED.name()
                : latestSubmission != null && latestSubmission.getStatus() != null
                    ? latestSubmission.getStatus().name()
                    : "BOOKMARKED");
        return response;
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

    private Map<Long, Submission> buildLatestSubmissionByProblemId(List<Submission> submissions) {
        Map<Long, Submission> latestByProblem = new LinkedHashMap<>();

        submissions.stream()
                .filter(submission -> submission.getProblem() != null && submission.getProblem().getId() != null)
                .sorted((left, right) -> compareActivityTimes(right, left))
                .forEach(submission -> latestByProblem.putIfAbsent(submission.getProblem().getId(), submission));

        return latestByProblem;
    }

    private int compareActivityTimes(Submission left, Submission right) {
        LocalDateTime leftTime = left.getJudgedAt() != null ? left.getJudgedAt() : left.getCreatedAt();
        LocalDateTime rightTime = right.getJudgedAt() != null ? right.getJudgedAt() : right.getCreatedAt();

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

    private int difficultyOrder(Difficulty difficulty) {
        if (difficulty == null) {
            return Integer.MAX_VALUE;
        }

        return switch (difficulty) {
            case EASY -> 0;
            case MEDIUM -> 1;
            case HARD -> 2;
        };
    }

    private DashboardProblemActivityResponse toProblemActivityResponse(Submission submission) {
        DashboardProblemActivityResponse response = new DashboardProblemActivityResponse();
        response.setSubmissionId(submission.getId());
        response.setProblemId(submission.getProblem() == null ? null : submission.getProblem().getId());
        response.setProblemTitle(submission.getProblem() == null ? null : submission.getProblem().getTitle());
        response.setDifficulty(submission.getProblem() == null || submission.getProblem().getDifficulty() == null
                ? null
                : submission.getProblem().getDifficulty().name());
        response.setStatus(submission.getStatus() == null ? null : submission.getStatus().name());
        response.setLanguage(submission.getLanguage() == null ? null : submission.getLanguage().name());
        response.setLastActivityAt(submission.getJudgedAt() != null ? submission.getJudgedAt() : submission.getCreatedAt());
        return response;
    }

    private DashboardRecentAcceptedResponse toRecentAcceptedResponse(Submission submission) {
        DashboardRecentAcceptedResponse response = new DashboardRecentAcceptedResponse();
        response.setSubmissionId(submission.getId());
        response.setProblemId(submission.getProblem() == null ? null : submission.getProblem().getId());
        response.setProblemTitle(submission.getProblem() == null ? null : submission.getProblem().getTitle());
        response.setLanguage(submission.getLanguage() == null ? null : submission.getLanguage().name());
        response.setAcceptedAt(submission.getJudgedAt() != null ? submission.getJudgedAt() : submission.getCreatedAt());
        response.setExecutionTime(submission.getExecutionTime());
        response.setMemoryUsage(submission.getMemoryUsage());
        return response;
    }

    private LocalDateTime activityTime(Submission submission) {
        return submission.getJudgedAt() != null ? submission.getJudgedAt() : submission.getCreatedAt();
    }
}
