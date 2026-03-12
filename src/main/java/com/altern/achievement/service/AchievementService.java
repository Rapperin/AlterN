package com.altern.achievement.service;

import com.altern.achievement.dto.AchievementBadgeResponse;
import com.altern.achievement.dto.JourneyGoalResponse;
import com.altern.achievement.dto.JourneyResponse;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AchievementService {

    private static final List<JourneyTier> JOURNEY_TIERS = List.of(
            new JourneyTier(1, "Explorer", 0),
            new JourneyTier(2, "Rookie", 1),
            new JourneyTier(3, "Builder", 3),
            new JourneyTier(4, "Solver", 5),
            new JourneyTier(5, "Challenger", 8),
            new JourneyTier(6, "Strategist", 12),
            new JourneyTier(7, "Architect", 16),
            new JourneyTier(8, "Legend", 20)
    );

    public List<AchievementBadgeResponse> resolveAchievements(List<Submission> submissions) {
        AchievementFacts facts = buildFacts(submissions);
        List<AchievementBadgeResponse> achievements = new ArrayList<>();

        addIf(achievements, facts.acceptedSubmissions() > 0,
                "FIRST_ACCEPTED",
                "First Accepted",
                "Ilk accepted gonderimini aldin.");
        addIf(achievements, facts.solvedProblems() >= 5,
                "FIVE_SOLVED",
                "Five Down",
                "Bes farkli problemi solved ettin.");
        addIf(achievements, facts.hardSolvedProblems() >= 1,
                "HARD_SOLVER",
                "Hard Things",
                "En az bir hard problemi cozdun.");
        addIf(achievements, facts.acceptedLanguages() >= 3,
                "POLYGLOT",
                "Polyglot",
                "Accepted sonucunu uc farkli dilde aldin.");
        addIf(achievements, facts.comebackProblems() >= 1,
                "COMEBACK",
                "Comeback",
                "Daha once takildigin bir problemi sonra accepted ettin.");
        addIf(achievements, facts.longestAcceptedStreak() >= 3,
                "STREAK_3",
                "On a Roll",
                "Uc gun veya daha uzun accepted serisi yakaladin.");
        return achievements;
    }

    public JourneyResponse resolveJourney(List<Submission> submissions) {
        AchievementFacts facts = buildFacts(submissions);
        JourneyTier currentTier = currentTier(facts.solvedProblems());
        JourneyTier nextTier = nextTier(facts.solvedProblems());

        JourneyResponse response = new JourneyResponse();
        response.setLevel(currentTier.level());
        response.setTitle(currentTier.title());
        response.setSolvedProblems(facts.solvedProblems());
        response.setMaxLevel(nextTier == null);
        response.setNextLevel(nextTier == null ? null : nextTier.level());
        response.setNextTitle(nextTier == null ? null : nextTier.title());
        response.setNextSolvedTarget(nextTier == null ? null : nextTier.solvedTarget());
        response.setProgressPercent(resolveProgressPercent(facts.solvedProblems(), currentTier, nextTier));
        response.setNextGoals(resolveNextGoals(facts));
        return response;
    }

    private AchievementFacts buildFacts(List<Submission> submissions) {
        List<Submission> sortedSubmissions = submissions.stream()
                .sorted(Comparator.comparing(this::activityTime, Comparator.nullsLast(LocalDateTime::compareTo)))
                .toList();
        List<Submission> acceptedSubmissions = sortedSubmissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .toList();

        Set<Long> solvedProblemIds = new LinkedHashSet<>();
        Set<ProgrammingLanguage> acceptedLanguages = new LinkedHashSet<>();
        Set<Long> problemsWithEarlierFailure = new HashSet<>();
        Set<Long> comebackProblemIds = new HashSet<>();
        Set<Long> hardSolvedProblemIds = new LinkedHashSet<>();

        for (Submission submission : sortedSubmissions) {
            Long problemId = submission.getProblem() == null ? null : submission.getProblem().getId();
            if (problemId == null) {
                continue;
            }

            if (submission.getStatus() == SubmissionStatus.ACCEPTED) {
                solvedProblemIds.add(problemId);
                if (submission.getLanguage() != null) {
                    acceptedLanguages.add(submission.getLanguage());
                }
                if (problemsWithEarlierFailure.contains(problemId)) {
                    comebackProblemIds.add(problemId);
                }
                Problem problem = submission.getProblem();
                if (problem != null && problem.getDifficulty() == Difficulty.HARD) {
                    hardSolvedProblemIds.add(problemId);
                }
                continue;
            }

            if (submission.getStatus() != SubmissionStatus.PENDING) {
                problemsWithEarlierFailure.add(problemId);
            }
        }

        List<LocalDate> acceptedDays = acceptedSubmissions.stream()
                .map(this::activityTime)
                .filter(java.util.Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        return new AchievementFacts(
                solvedProblemIds.size(),
                acceptedSubmissions.size(),
                acceptedLanguages.size(),
                hardSolvedProblemIds.size(),
                comebackProblemIds.size(),
                resolveLongestAcceptedStreak(acceptedDays)
        );
    }

    private List<JourneyGoalResponse> resolveNextGoals(AchievementFacts facts) {
        Map<String, JourneyGoalResponse> goals = new LinkedHashMap<>();

        addGoal(goals, "FIRST_ACCEPTED", "First Accepted", "Ilk accepted gonderimini al.", facts.acceptedSubmissions(), 1, "accepted");
        addGoal(goals, "FIVE_SOLVED", "Five Down", "Bes farkli problemi solved et.", facts.solvedProblems(), 5, "solved");
        addGoal(goals, "HARD_SOLVER", "Hard Things", "Bir hard problemi solved et.", facts.hardSolvedProblems(), 1, "hard");
        addGoal(goals, "POLYGLOT", "Polyglot", "Uc farkli dilde accepted al.", facts.acceptedLanguages(), 3, "lang");
        addGoal(goals, "COMEBACK", "Comeback", "Takildigin bir problemi sonra accepted et.", facts.comebackProblems(), 1, "comeback");
        addGoal(goals, "STREAK_3", "On a Roll", "Uc gun accepted serisi yakala.", facts.longestAcceptedStreak(), 3, "day");

        return goals.values().stream()
                .filter(goal -> goal.getCurrentValue() < goal.getTargetValue())
                .sorted(Comparator
                        .comparingInt((JourneyGoalResponse goal) -> goal.getTargetValue() - goal.getCurrentValue())
                        .thenComparingInt(goal -> goalPriority(goal.getCode()))
                        .thenComparing(JourneyGoalResponse::getTitle))
                .limit(3)
                .toList();
    }

    private int goalPriority(String code) {
        return switch (code) {
            case "HARD_SOLVER" -> 0;
            case "COMEBACK" -> 1;
            case "STREAK_3" -> 2;
            case "FIVE_SOLVED" -> 3;
            case "POLYGLOT" -> 4;
            case "FIRST_ACCEPTED" -> 5;
            default -> 99;
        };
    }

    private void addGoal(
            Map<String, JourneyGoalResponse> goals,
            String code,
            String title,
            String description,
            int currentValue,
            int targetValue,
            String unit
    ) {
        JourneyGoalResponse goal = new JourneyGoalResponse();
        goal.setCode(code);
        goal.setTitle(title);
        goal.setDescription(description);
        goal.setCurrentValue(Math.min(currentValue, targetValue));
        goal.setTargetValue(targetValue);
        goal.setUnit(unit);
        goals.put(code, goal);
    }

    private JourneyTier currentTier(int solvedProblems) {
        JourneyTier current = JOURNEY_TIERS.get(0);
        for (JourneyTier tier : JOURNEY_TIERS) {
            if (solvedProblems >= tier.solvedTarget()) {
                current = tier;
            }
        }
        return current;
    }

    private JourneyTier nextTier(int solvedProblems) {
        return JOURNEY_TIERS.stream()
                .filter(tier -> solvedProblems < tier.solvedTarget())
                .findFirst()
                .orElse(null);
    }

    private int resolveProgressPercent(int solvedProblems, JourneyTier currentTier, JourneyTier nextTier) {
        if (nextTier == null) {
            return 100;
        }

        int previousTarget = currentTier.solvedTarget();
        int span = Math.max(nextTier.solvedTarget() - previousTarget, 1);
        int progress = Math.max(solvedProblems - previousTarget, 0);
        return (int) Math.round((progress * 100.0) / span);
    }

    private void addIf(List<AchievementBadgeResponse> achievements, boolean condition, String code, String title, String description) {
        if (!condition) {
            return;
        }

        AchievementBadgeResponse achievement = new AchievementBadgeResponse();
        achievement.setCode(code);
        achievement.setTitle(title);
        achievement.setDescription(description);
        achievements.add(achievement);
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

    private LocalDateTime activityTime(Submission submission) {
        return submission.getJudgedAt() != null ? submission.getJudgedAt() : submission.getCreatedAt();
    }

    private record AchievementFacts(
            int solvedProblems,
            int acceptedSubmissions,
            int acceptedLanguages,
            int hardSolvedProblems,
            int comebackProblems,
            int longestAcceptedStreak
    ) {
    }

    private record JourneyTier(int level, String title, int solvedTarget) {
    }
}
