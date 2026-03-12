package com.altern.config;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.entity.UserRole;
import com.altern.auth.repository.UserAccountRepository;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.entity.ProblemExampleValue;
import com.altern.problem.repository.ProblemRepository;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SampleDataInitializer implements CommandLineRunner {

    private static final String JAVA = "JAVA";
    private static final String PYTHON = "PYTHON";
    private static final String CPP = "CPP";

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper;
    private final Resource seedProblemsResource = new org.springframework.core.io.ClassPathResource("catalog/seed-problems.json");

    @Override
    public void run(String... args) {
        seedUsers();
        seedProblems();
    }

    private void seedUsers() {
        if (!userAccountRepository.existsByUsername("admin")) {
            saveUser("admin", "admin123", UserRole.ADMIN);
        }

        if (!userAccountRepository.existsByUsername("demo")) {
            saveUser("demo", "demo123", UserRole.USER);
        }
    }

    private void seedProblems() {
        SeedCatalog catalog = loadCatalog();
        validateCatalog(catalog);
        for (SeedProblemDefinition definition : catalog.getProblems()) {
            Problem problem = findOrCreate(definition.getTitle());
            applySeedProblem(problem, definition);
            Problem savedProblem = problemRepository.save(problem);
            ensureTestCases(savedProblem, definition.getTestCases());
        }
    }

    private SeedCatalog loadCatalog() {
        try {
            return objectMapper.readValue(seedProblemsResource.getInputStream(), SeedCatalog.class);
        } catch (IOException exception) {
            throw new IllegalStateException("Seed catalog could not be loaded.", exception);
        }
    }

    private void applySeedProblem(Problem problem, SeedProblemDefinition definition) {
        problem.setTitle(definition.getTitle());
        problem.setDescription(definition.getDescription());
        problem.setDifficulty(parseDifficulty(definition.getDifficulty()));
        problem.setTimeLimitMs(definition.getTimeLimitMs());
        problem.setMemoryLimitMb(definition.getMemoryLimitMb());
        problem.setConstraints(definition.getConstraints());
        problem.setInputFormat(definition.getInputFormat());
        problem.setOutputFormat(definition.getOutputFormat());
        problem.setHintTitle(definition.getHintTitle());
        problem.setHintContent(definition.getHintContent());
        problem.setEditorialTitle(definition.getEditorialTitle());
        problem.setEditorialContent(definition.getEditorialContent());
        problem.setTags(copyTags(definition.getTags()));
        problem.setExamples(copyExamples(definition.getExamples()));
        applyStarterCodes(problem, definition.getStarterCodes());
    }

    private Difficulty parseDifficulty(String difficulty) {
        return Difficulty.valueOf(String.valueOf(difficulty).trim().toUpperCase(Locale.ROOT));
    }

    private List<String> copyTags(List<String> tags) {
        if (tags == null) {
            return new ArrayList<>();
        }

        return new ArrayList<>(tags.stream()
                .map(tag -> tag == null ? "" : tag.trim())
                .filter(tag -> !tag.isBlank())
                .toList());
    }

    private List<ProblemExampleValue> copyExamples(List<SeedExampleDefinition> examples) {
        List<ProblemExampleValue> values = new ArrayList<>();
        if (examples == null) {
            return values;
        }

        for (SeedExampleDefinition example : examples) {
            ProblemExampleValue value = new ProblemExampleValue();
            value.setInput(example.getInput());
            value.setOutput(example.getOutput());
            value.setExplanation(example.getExplanation());
            values.add(value);
        }
        return values;
    }

    private void applyStarterCodes(Problem problem, Map<String, String> starterCodes) {
        problem.setStarterCodeJava(resolveStarterCode(starterCodes, JAVA, starterJavaLong()));
        problem.setStarterCodePython(resolveStarterCode(starterCodes, PYTHON, starterPython()));
        problem.setStarterCodeCpp(resolveStarterCode(starterCodes, CPP, starterCpp()));
    }

    private String resolveStarterCode(Map<String, String> starterCodes, String language, String fallback) {
        if (starterCodes == null) {
            return fallback;
        }

        String configured = starterCodes.entrySet().stream()
                .filter(entry -> language.equalsIgnoreCase(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);

        if (configured == null || configured.isBlank()) {
            return fallback;
        }

        return configured;
    }

    private void ensureTestCases(Problem problem, List<SeedTestCaseDefinition> definitions) {
        if (definitions == null || definitions.isEmpty()) {
            return;
        }

        List<TestCase> existing = new ArrayList<>(problem.getId() == null
                ? List.of()
                : testCaseRepository.findByProblem_Id(problem.getId()));

        for (SeedTestCaseDefinition definition : definitions) {
            boolean alreadyExists = existing.stream().anyMatch(testCase ->
                    sameText(testCase.getInput(), definition.getInput())
                            && sameText(testCase.getExpectedOutput(), definition.getExpectedOutput())
                            && sameHidden(testCase.getHidden(), definition.getHidden())
            );
            if (alreadyExists) {
                continue;
            }

            TestCase testCase = new TestCase();
            testCase.setProblem(problem);
            testCase.setInput(definition.getInput());
            testCase.setExpectedOutput(definition.getExpectedOutput());
            testCase.setHidden(definition.getHidden());
            testCaseRepository.save(testCase);
            existing.add(testCase);
        }
    }

    private void validateCatalog(SeedCatalog catalog) {
        if (catalog.getProblems() == null || catalog.getProblems().isEmpty()) {
            throw new IllegalStateException("Seed catalog must contain at least one problem.");
        }

        for (SeedProblemDefinition definition : catalog.getProblems()) {
            validateProblemDefinition(definition);
        }
    }

    private void validateProblemDefinition(SeedProblemDefinition definition) {
        if (definition.getTitle() == null || definition.getTitle().isBlank()) {
            throw new IllegalStateException("Seed problem title is required.");
        }
        if (definition.getDescription() == null || definition.getDescription().isBlank()) {
            throw new IllegalStateException("Seed problem description is required for " + definition.getTitle());
        }
        if (definition.getDifficulty() == null || definition.getDifficulty().isBlank()) {
            throw new IllegalStateException("Seed problem difficulty is required for " + definition.getTitle());
        }
        if (definition.getTimeLimitMs() == null || definition.getTimeLimitMs() < 1) {
            throw new IllegalStateException("Seed problem timeLimitMs must be positive for " + definition.getTitle());
        }
        if (definition.getMemoryLimitMb() != null && definition.getMemoryLimitMb() < 1) {
            throw new IllegalStateException("Seed problem memoryLimitMb must be positive for " + definition.getTitle());
        }
        if (definition.getTestCases() == null || definition.getTestCases().size() < 3) {
            throw new IllegalStateException("Seed problem must define at least 3 testcases: " + definition.getTitle());
        }

        long publicCount = definition.getTestCases().stream()
                .filter(testCase -> !Boolean.TRUE.equals(testCase.getHidden()))
                .count();
        long hiddenCount = definition.getTestCases().stream()
                .filter(testCase -> Boolean.TRUE.equals(testCase.getHidden()))
                .count();

        if (publicCount < 1 || hiddenCount < 2) {
            throw new IllegalStateException("Seed problem must define at least 1 public and 2 hidden testcases: " + definition.getTitle());
        }

        long distinctCount = definition.getTestCases().stream()
                .map(testCase -> normalizeText(testCase.getInput()) + "|" + normalizeText(testCase.getExpectedOutput()) + "|" + Boolean.TRUE.equals(testCase.getHidden()))
                .distinct()
                .count();
        if (distinctCount != definition.getTestCases().size()) {
            throw new IllegalStateException("Seed problem has duplicate testcase rows: " + definition.getTitle());
        }
    }

    private Problem findOrCreate(String title) {
        return problemRepository.findByTitleIgnoreCase(title).orElseGet(() -> {
            Problem problem = new Problem();
            problem.setTitle(title);
            return problem;
        });
    }

    private String starterJavaLong() {
        return """
                public class Solution {
                    public static long solve(long n) {
                        return 0L;
                    }
                }
                """;
    }

    private String starterPython() {
        return """
                n = int(input().strip())

                result = 0

                print(result)
                """;
    }

    private String starterCpp() {
        return """
                #include <iostream>
                using namespace std;

                int main() {
                    long long n;
                    cin >> n;

                    long long result = 0;
                    cout << result;
                    return 0;
                }
                """;
    }

    private void saveUser(String username, String rawPassword, UserRole role) {
        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        userAccountRepository.save(user);
    }

    private boolean sameText(String left, String right) {
        return normalizeText(left).equals(normalizeText(right));
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean sameHidden(Boolean left, Boolean right) {
        return Boolean.TRUE.equals(left) == Boolean.TRUE.equals(right);
    }

    @Getter
    @Setter
    public static class SeedCatalog {
        private List<SeedProblemDefinition> problems = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class SeedProblemDefinition {
        private String title;
        private String description;
        private String difficulty;
        private Integer timeLimitMs;
        private Integer memoryLimitMb;
        private String constraints;
        private String inputFormat;
        private String outputFormat;
        private String hintTitle;
        private String hintContent;
        private String editorialTitle;
        private String editorialContent;
        private List<String> tags = new ArrayList<>();
        private List<SeedExampleDefinition> examples = new ArrayList<>();
        private Map<String, String> starterCodes;
        private List<SeedTestCaseDefinition> testCases = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class SeedExampleDefinition {
        private String input;
        private String output;
        private String explanation;
    }

    @Getter
    @Setter
    public static class SeedTestCaseDefinition {
        private String input;
        private String expectedOutput;
        private Boolean hidden;
    }
}
