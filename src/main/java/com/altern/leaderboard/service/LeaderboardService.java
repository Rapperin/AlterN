package com.altern.leaderboard.service;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.entity.UserRole;
import com.altern.auth.security.CurrentUserService;
import com.altern.common.ProblemNotFoundException;
import com.altern.leaderboard.dto.GlobalLeaderboardEntryResponse;
import com.altern.leaderboard.dto.GlobalLeaderboardResponse;
import com.altern.leaderboard.dto.ProblemLeaderboardEntryResponse;
import com.altern.leaderboard.dto.ProblemLeaderboardResponse;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private static final int GLOBAL_LEADERBOARD_LIMIT = 8;
    private static final int PROBLEM_LEADERBOARD_LIMIT = 8;

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final CurrentUserService currentUserService;

    public GlobalLeaderboardResponse getGlobalLeaderboard() {
        Long viewerUserId = currentUserService.findCurrentUser()
                .map(UserAccount::getId)
                .orElse(null);

        Map<Long, UserSubmissionStats> statsByUser = new LinkedHashMap<>();
        for (Submission submission : submissionRepository.findAll()) {
            if (!isPublicLeaderboardUser(submission)) {
                continue;
            }

            Long userId = submission.getUser().getId();
            UserSubmissionStats stats = statsByUser.computeIfAbsent(userId, ignored -> new UserSubmissionStats(submission.getUser()));
            stats.totalSubmissions++;

            if (submission.getLanguage() != null) {
                stats.languageBreakdown.merge(submission.getLanguage(), 1, Integer::sum);
            }

            if (submission.getStatus() == SubmissionStatus.ACCEPTED) {
                stats.acceptedSubmissions++;
                if (submission.getProblem() != null && submission.getProblem().getId() != null) {
                    stats.solvedProblemIds.add(submission.getProblem().getId());
                }
                stats.updateRecentAccepted(submission);
            }
        }

        List<GlobalLeaderboardEntryResponse> entries = statsByUser.values().stream()
                .sorted(this::compareGlobalStats)
                .limit(GLOBAL_LEADERBOARD_LIMIT)
                .map(stats -> toGlobalEntry(stats, viewerUserId))
                .toList();

        for (int index = 0; index < entries.size(); index++) {
            entries.get(index).setRank(index + 1);
        }

        GlobalLeaderboardResponse response = new GlobalLeaderboardResponse();
        response.setTotalRankedUsers(statsByUser.size());
        response.setTotalAcceptedSubmissions(statsByUser.values().stream()
                .mapToInt(stats -> stats.acceptedSubmissions)
                .sum());
        response.setEntries(entries);
        return response;
    }

    public ProblemLeaderboardResponse getProblemLeaderboard(Long problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException(problemId));
        Long viewerUserId = currentUserService.findCurrentUser()
                .map(UserAccount::getId)
                .orElse(null);

        List<Submission> acceptedSubmissions = submissionRepository.findByProblem_IdAndStatus(problemId, SubmissionStatus.ACCEPTED)
                .stream()
                .filter(this::isPublicLeaderboardUser)
                .toList();

        Map<Long, Submission> bestByUser = new LinkedHashMap<>();
        acceptedSubmissions.stream()
                .sorted(this::compareProblemRuns)
                .forEach(submission -> {
                    Long userId = submission.getUser() == null ? null : submission.getUser().getId();
                    if (userId != null) {
                        bestByUser.putIfAbsent(userId, submission);
                    }
                });

        List<ProblemLeaderboardEntryResponse> entries = bestByUser.values().stream()
                .sorted(this::compareProblemRuns)
                .limit(PROBLEM_LEADERBOARD_LIMIT)
                .map(submission -> toProblemEntry(submission, viewerUserId))
                .toList();

        for (int index = 0; index < entries.size(); index++) {
            entries.get(index).setRank(index + 1);
        }

        ProblemLeaderboardResponse response = new ProblemLeaderboardResponse();
        response.setProblemId(problem.getId());
        response.setProblemTitle(problem.getTitle());
        response.setTotalAcceptedUsers(bestByUser.size());
        response.setTotalAcceptedSubmissions(acceptedSubmissions.size());
        response.setEntries(entries);
        return response;
    }

    private boolean isPublicLeaderboardUser(Submission submission) {
        return submission != null
                && submission.getUser() != null
                && submission.getUser().getRole() == UserRole.USER;
    }

    private int compareGlobalStats(UserSubmissionStats left, UserSubmissionStats right) {
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

    private int compareProblemRuns(Submission left, Submission right) {
        return Comparator
                .comparing(Submission::getExecutionTime, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(Submission::getMemoryUsage, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(this::activityTime, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(Submission::getId, Comparator.nullsLast(Long::compareTo))
                .compare(left, right);
    }

    private GlobalLeaderboardEntryResponse toGlobalEntry(UserSubmissionStats stats, Long viewerUserId) {
        GlobalLeaderboardEntryResponse response = new GlobalLeaderboardEntryResponse();
        response.setUserId(stats.user.getId());
        response.setUsername(stats.user.getUsername());
        response.setSolvedProblems(stats.solvedProblems());
        response.setAcceptedSubmissions(stats.acceptedSubmissions);
        response.setTotalSubmissions(stats.totalSubmissions);
        response.setAcceptanceRate(stats.acceptanceRate());
        response.setMostUsedLanguage(resolveMostUsedLanguage(stats.languageBreakdown));
        response.setRecentAcceptedProblemId(stats.recentAcceptedProblemId);
        response.setRecentAcceptedProblemTitle(stats.recentAcceptedProblemTitle);
        response.setRecentAcceptedAt(stats.recentAcceptedAt());
        response.setViewer(viewerUserId != null && viewerUserId.equals(stats.user.getId()));
        return response;
    }

    private ProblemLeaderboardEntryResponse toProblemEntry(Submission submission, Long viewerUserId) {
        ProblemLeaderboardEntryResponse response = new ProblemLeaderboardEntryResponse();
        response.setSubmissionId(submission.getId());
        response.setUserId(submission.getUser().getId());
        response.setUsername(submission.getUser().getUsername());
        response.setLanguage(submission.getLanguage() == null ? null : submission.getLanguage().name());
        response.setExecutionTime(submission.getExecutionTime());
        response.setMemoryUsage(submission.getMemoryUsage());
        response.setAcceptedAt(activityTime(submission));
        response.setViewer(viewerUserId != null && viewerUserId.equals(submission.getUser().getId()));
        return response;
    }

    private LocalDateTime activityTime(Submission submission) {
        return submission.getJudgedAt() != null ? submission.getJudgedAt() : submission.getCreatedAt();
    }

    private String resolveMostUsedLanguage(Map<ProgrammingLanguage, Integer> languageBreakdown) {
        return languageBreakdown.entrySet().stream()
                .max(Comparator.<Map.Entry<ProgrammingLanguage, Integer>>comparingInt(Map.Entry::getValue)
                        .thenComparing(entry -> entry.getKey().name()))
                .map(entry -> entry.getKey().name())
                .orElse(null);
    }

    private static final class UserSubmissionStats {
        private final UserAccount user;
        private final Set<Long> solvedProblemIds = new java.util.LinkedHashSet<>();
        private final Map<ProgrammingLanguage, Integer> languageBreakdown = new EnumMap<>(ProgrammingLanguage.class);
        private int acceptedSubmissions;
        private int totalSubmissions;
        private Long recentAcceptedProblemId;
        private String recentAcceptedProblemTitle;
        private LocalDateTime recentAcceptedAt;

        private UserSubmissionStats(UserAccount user) {
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
                recentAcceptedProblemId = submission.getProblem() == null ? null : submission.getProblem().getId();
                recentAcceptedProblemTitle = submission.getProblem() == null ? null : submission.getProblem().getTitle();
            }
        }
    }
}
