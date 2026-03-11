package com.altern.dashboard.service;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.security.CurrentUserService;
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

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumMap;
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

    private final CurrentUserService currentUserService;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;

    public UserDashboardResponse getCurrentUserDashboard() {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        List<Problem> problems = problemRepository.findAll();
        List<Submission> submissions = submissionRepository.findByUser_Id(currentUser.getId());

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
        response.setAcceptedSubmissions(acceptedSubmissions);
        response.setAcceptanceRate(submissions.isEmpty()
                ? 0
                : (int) Math.round((acceptedSubmissions * 100.0) / submissions.size()));
        response.setLanguageBreakdown(buildLanguageBreakdown(submissions));
        response.setMostUsedLanguage(resolveMostUsedLanguage(response.getLanguageBreakdown()));
        response.setSolvedByDifficulty(buildSolvedByDifficulty(problems, solvedProblemIds));
        List<DashboardProblemActivityResponse> recentAttempted = buildRecentAttempted(submissions, solvedProblemIds);
        response.setContinueAttempt(recentAttempted.isEmpty() ? null : recentAttempted.get(0));
        response.setRecentAttempted(recentAttempted);
        response.setSuggestedProblem(buildSuggestedProblem(problems, solvedProblemIds, attemptedProblemIds, recentAttempted));
        response.setRecentAccepted(buildRecentAccepted(submissions));
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

    private DashboardProblemActivityResponse buildSuggestedProblem(
            List<Problem> problems,
            Set<Long> solvedProblemIds,
            Set<Long> attemptedProblemIds,
            List<DashboardProblemActivityResponse> recentAttempted
    ) {
        Set<Long> excludedProblemIds = new HashSet<>();
        recentAttempted.stream()
                .findFirst()
                .map(DashboardProblemActivityResponse::getProblemId)
                .ifPresent(excludedProblemIds::add);

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

        DashboardProblemActivityResponse response = new DashboardProblemActivityResponse();
        response.setProblemId(suggested.getId());
        response.setProblemTitle(suggested.getTitle());
        response.setDifficulty(suggested.getDifficulty() == null ? null : suggested.getDifficulty().name());
        response.setStatus(attemptedProblemIds.contains(suggested.getId()) ? "ATTEMPTED" : "NOT_STARTED");
        return response;
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
}
