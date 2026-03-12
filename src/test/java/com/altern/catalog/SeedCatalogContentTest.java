package com.altern.catalog;

import com.altern.config.SampleDataInitializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SeedCatalogContentTest {

    private static final Map<String, Integer> HARDENED_PROBLEM_MIN_CASES = Map.ofEntries(
            Map.entry("Multiples of 3 or 5", 8),
            Map.entry("Even Fibonacci Sum", 8),
            Map.entry("Largest Prime Factor", 8),
            Map.entry("Sum of Primes Below N", 8),
            Map.entry("Special Pythagorean Triplet", 8),
            Map.entry("Highly Divisible Triangle", 7),
            Map.entry("Coin Sums", 9),
            Map.entry("Longest Collatz Start", 8),
            Map.entry("Maximum Path Sum I", 8),
            Map.entry("Double-Base Palindrome Sum", 7)
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void seedCatalogMaintainsMinimumContentQualityBar() throws IOException {
        SampleDataInitializer.SeedCatalog catalog = objectMapper.readValue(
                new ClassPathResource("catalog/seed-problems.json").getInputStream(),
                SampleDataInitializer.SeedCatalog.class
        );

        assertNotNull(catalog.getProblems());
        assertTrue(catalog.getProblems().size() >= 20, "Seed catalog should contain a meaningful starter set.");

        int totalTestCases = 0;
        for (SampleDataInitializer.SeedProblemDefinition problem : catalog.getProblems()) {
            assertNotNull(problem.getTitle());
            assertFalse(problem.getTitle().isBlank(), "Seed problem title must exist.");
            assertNotNull(problem.getDescription());
            assertFalse(problem.getDescription().isBlank(), "Seed problem description must exist.");
            assertTrue(
                    problem.getMemoryLimitMb() == null || problem.getMemoryLimitMb() > 0,
                    "Seed problem memory limit must be positive when defined."
            );
            assertNotNull(problem.getHintTitle());
            assertFalse(problem.getHintTitle().isBlank(), "Seed problem hint title must exist.");
            assertNotNull(problem.getEditorialTitle());
            assertFalse(problem.getEditorialTitle().isBlank(), "Seed problem editorial title must exist.");
            assertNotNull(problem.getExamples());
            assertTrue(problem.getExamples().size() >= 2, "Each seed problem should provide at least two examples.");
            assertNotNull(problem.getTestCases());
            assertTrue(problem.getTestCases().size() >= 4, "Each seed problem should provide at least four testcases.");

            long publicCases = problem.getTestCases().stream()
                    .filter(testCase -> !Boolean.TRUE.equals(testCase.getHidden()))
                    .count();
            long hiddenCases = problem.getTestCases().stream()
                    .filter(testCase -> Boolean.TRUE.equals(testCase.getHidden()))
                    .count();

            assertTrue(publicCases >= 2, "Each seed problem should expose at least two public testcases.");
            assertTrue(hiddenCases >= 2, "Each seed problem should keep at least two hidden testcases.");
            if (HARDENED_PROBLEM_MIN_CASES.containsKey(problem.getTitle())) {
                assertTrue(
                        problem.getTestCases().size() >= HARDENED_PROBLEM_MIN_CASES.get(problem.getTitle()),
                        () -> problem.getTitle() + " should carry a deeper testcase pack."
                );
                assertTrue(publicCases >= 3, () -> problem.getTitle() + " should expose at least three public testcases.");
                assertTrue(hiddenCases >= 4, () -> problem.getTitle() + " should keep at least four hidden testcases.");
            }
            assertEqualsDistinctRows(problem);
            totalTestCases += problem.getTestCases().size();
        }

        assertTrue(totalTestCases >= 125, "Starter catalog should carry a non-trivial testcase pack.");
    }

    private void assertEqualsDistinctRows(SampleDataInitializer.SeedProblemDefinition problem) {
        long distinctCount = problem.getTestCases().stream()
                .map(testCase -> normalize(testCase.getInput()) + "|" + normalize(testCase.getExpectedOutput()) + "|" + Boolean.TRUE.equals(testCase.getHidden()))
                .distinct()
                .count();

        assertTrue(
                distinctCount == problem.getTestCases().size(),
                () -> "Duplicate testcase rows found in " + problem.getTitle()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
