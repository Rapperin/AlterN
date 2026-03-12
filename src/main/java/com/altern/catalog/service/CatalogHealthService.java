package com.altern.catalog.service;

import com.altern.auth.security.CurrentUserService;
import com.altern.catalog.dto.CatalogHealthProblemResponse;
import com.altern.catalog.dto.CatalogHealthResponse;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogHealthService {

    private static final int MIN_TOTAL_TEST_CASES = 4;
    private static final int MIN_PUBLIC_TEST_CASES = 2;
    private static final int MIN_HIDDEN_TEST_CASES = 2;
    private static final int MIN_EXAMPLES = 2;

    private final CurrentUserService currentUserService;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;

    public CatalogHealthResponse getCatalogHealth() {
        ensureAdmin();

        List<Problem> problems = problemRepository.findAll();
        List<TestCase> testCases = testCaseRepository.findAll();
        Map<Long, List<TestCase>> testCasesByProblemId = testCases.stream()
                .filter(testCase -> testCase.getProblem() != null && testCase.getProblem().getId() != null)
                .collect(Collectors.groupingBy(testCase -> testCase.getProblem().getId()));

        CatalogHealthResponse response = new CatalogHealthResponse();
        response.setTotalProblems(problems.size());
        response.setTotalTestCases(testCases.size());
        response.setHiddenTestCases((int) testCases.stream().filter(this::isHidden).count());
        response.setPublicTestCases(response.getTotalTestCases() - response.getHiddenTestCases());
        response.setProblemsByDifficulty(buildDifficultyBreakdown(problems));

        List<CatalogHealthProblemResponse> attentionProblems = problems.stream()
                .map(problem -> toAttentionProblem(problem, testCasesByProblemId.getOrDefault(problem.getId(), List.of())))
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparingInt((CatalogHealthProblemResponse item) -> item.getAttentionFlags().size())
                        .reversed()
                        .thenComparing(CatalogHealthProblemResponse::getTitle, String.CASE_INSENSITIVE_ORDER))
                .toList();

        response.setAttentionProblems(attentionProblems);
        response.setProblemsNeedingAttention(attentionProblems.size());
        response.setHealthyProblems(Math.max(problems.size() - attentionProblems.size(), 0));
        return response;
    }

    private Map<String, Integer> buildDifficultyBreakdown(List<Problem> problems) {
        Map<Difficulty, Integer> counts = new EnumMap<>(Difficulty.class);
        for (Difficulty difficulty : Difficulty.values()) {
            counts.put(difficulty, 0);
        }

        for (Problem problem : problems) {
            if (problem.getDifficulty() == null) {
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

    private CatalogHealthProblemResponse toAttentionProblem(Problem problem, List<TestCase> testCases) {
        int hiddenCount = (int) testCases.stream().filter(this::isHidden).count();
        int publicCount = testCases.size() - hiddenCount;
        int exampleCount = problem.getExamples() == null ? 0 : problem.getExamples().size();
        boolean hintMissing = !hasText(problem.getHintTitle()) || !hasText(problem.getHintContent());
        boolean editorialMissing = !hasText(problem.getEditorialTitle()) || !hasText(problem.getEditorialContent());

        List<String> attentionFlags = new ArrayList<>();
        if (publicCount < MIN_PUBLIC_TEST_CASES) {
            attentionFlags.add("NEEDS_PUBLIC_SAMPLE");
        }
        if (hiddenCount < MIN_HIDDEN_TEST_CASES) {
            attentionFlags.add("NEEDS_HIDDEN_DEPTH");
        }
        if (testCases.size() < MIN_TOTAL_TEST_CASES) {
            attentionFlags.add("LOW_TOTAL_CASE_COVERAGE");
        }
        if (exampleCount < MIN_EXAMPLES) {
            attentionFlags.add("LOW_EXAMPLE_DEPTH");
        }
        if (hintMissing) {
            attentionFlags.add("MISSING_HINT");
        }
        if (editorialMissing) {
            attentionFlags.add("MISSING_EDITORIAL");
        }

        if (attentionFlags.isEmpty()) {
            return null;
        }

        CatalogHealthProblemResponse response = new CatalogHealthProblemResponse();
        response.setProblemId(problem.getId());
        response.setTitle(problem.getTitle());
        response.setDifficulty(problem.getDifficulty() == null ? null : problem.getDifficulty().name());
        response.setTotalTestCases(testCases.size());
        response.setPublicTestCases(publicCount);
        response.setHiddenTestCases(hiddenCount);
        response.setExampleCount(exampleCount);
        response.setHintMissing(hintMissing);
        response.setEditorialMissing(editorialMissing);
        response.setAttentionFlags(attentionFlags);
        return response;
    }

    private boolean isHidden(TestCase testCase) {
        return Boolean.TRUE.equals(testCase.getHidden());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void ensureAdmin() {
        if (!currentUserService.isAdmin()) {
            throw new AccessDeniedException("Access denied.");
        }
    }
}
