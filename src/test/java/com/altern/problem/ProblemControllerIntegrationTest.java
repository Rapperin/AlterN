package com.altern.problem;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.repository.UserAccountRepository;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
import com.altern.testcase.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProblemControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private TestCaseRepository testCaseRepository;

    @Test
    void createProblemPersistsCustomTimeLimit() throws Exception {
        String adminToken = login("admin", "admin123");

        mockMvc.perform(post("/api/problems")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Timed Problem",
                                  "description": "Checks custom execution limits.",
                                  "difficulty": "EASY",
                                  "timeLimitMs": 250
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern("/api/problems/\\d+")))
                .andExpect(jsonPath("$.title").value("Timed Problem"))
                .andExpect(jsonPath("$.timeLimitMs").value(250));
    }

    @Test
    void createProblemPersistsCustomMemoryLimit() throws Exception {
        String adminToken = login("admin", "admin123");

        mockMvc.perform(post("/api/problems")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Memory Bound Problem",
                                  "description": "Checks custom memory limits.",
                                  "difficulty": "EASY",
                                  "memoryLimitMb": 384
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Memory Bound Problem"))
                .andExpect(jsonPath("$.memoryLimitMb").value(384));
    }

    @Test
    void createProblemCanImportVisibleAndHiddenTestCases() throws Exception {
        String adminToken = login("admin", "admin123");

        mockMvc.perform(post("/api/problems")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Import With Cases",
                                  "description": "Problem arrives with testcases.",
                                  "difficulty": "EASY",
                                  "testCases": [
                                    {
                                      "input": "10",
                                      "expectedOutput": "23",
                                      "hidden": false
                                    },
                                    {
                                      "input": "1000",
                                      "expectedOutput": "233168",
                                      "hidden": true
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.testCaseCount").value(1));
    }

    @Test
    void bookmarkProblemUpdatesViewerState() throws Exception {
        Problem problem = problemRepository.save(problem("Bookmarkable Problem"));
        String demoToken = login("demo", "demo123");

        mockMvc.perform(get("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewerBookmarked").value(false));

        mockMvc.perform(post("/api/problems/{id}/bookmark", problem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewerBookmarked").value(true));

        mockMvc.perform(get("/api/problems?page=0&size=20&title=Bookmarkable Problem")
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].viewerBookmarked").value(true));

        mockMvc.perform(delete("/api/problems/{id}/bookmark", problem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewerBookmarked").value(false));
    }

    @Test
    void problemStatsReturnsPublicCommunitySnapshot() throws Exception {
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        UserAccount adminUser = userAccountRepository.findByUsername("admin").orElseThrow();

        Problem problem = new Problem();
        problem.setTitle("Stats Problem");
        problem.setDescription("Community snapshot coverage.");
        problem.setDifficulty(Difficulty.MEDIUM);
        problem = problemRepository.save(problem);

        submissionRepository.save(submission(problem, demoUser, SubmissionStatus.WRONG_ANSWER));
        submissionRepository.save(submission(problem, demoUser));

        Submission pythonAccepted = submission(problem, demoUser);
        pythonAccepted.setLanguage(ProgrammingLanguage.PYTHON);
        pythonAccepted.setExecutionTime(7);
        pythonAccepted.setMemoryUsage(18);
        pythonAccepted.setJudgedAt(LocalDateTime.now().minusMinutes(1));
        pythonAccepted.setCreatedAt(pythonAccepted.getJudgedAt().minusSeconds(5));
        submissionRepository.save(pythonAccepted);

        Submission adminAccepted = submission(problem, adminUser);
        adminAccepted.setExecutionTime(1);
        adminAccepted.setMemoryUsage(1);
        submissionRepository.save(adminAccepted);

        mockMvc.perform(get("/api/problems/{id}/stats", problem.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problemTitle").value("Stats Problem"))
                .andExpect(jsonPath("$.totalSubmissions").value(3))
                .andExpect(jsonPath("$.acceptedSubmissions").value(2))
                .andExpect(jsonPath("$.acceptedUsers").value(1))
                .andExpect(jsonPath("$.acceptanceRate").value(67))
                .andExpect(jsonPath("$.mostUsedLanguage").value("JAVA"))
                .andExpect(jsonPath("$.languageBreakdown.JAVA").value(2))
                .andExpect(jsonPath("$.languageBreakdown.PYTHON").value(1))
                .andExpect(jsonPath("$.languageBreakdown.CPP").value(0))
                .andExpect(jsonPath("$.fastestExecutionTime").value(7))
                .andExpect(jsonPath("$.lowestMemoryUsage").value(18))
                .andExpect(jsonPath("$.latestAcceptedAt").isNotEmpty());
    }

    @Test
    void createProblemPersistsRichStatementFields() throws Exception {
        String adminToken = login("admin", "admin123");

        mockMvc.perform(post("/api/problems")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Rich Problem",
                                  "description": "Carries richer content.",
                                  "constraints": "1 <= n <= 1000",
                                  "inputFormat": "A single integer n.",
                                  "outputFormat": "Print the answer.",
                                  "hintTitle": "Start small",
                                  "hintContent": "Try the first few terms manually.",
                                  "editorialTitle": "Closed form",
                                  "editorialContent": "Use the arithmetic series formula.",
                                  "difficulty": "MEDIUM",
                                  "timeLimitMs": 800,
                                  "memoryLimitMb": 320,
                                  "tags": ["math", "dp"],
                                  "examples": [
                                    {
                                      "input": "5",
                                      "output": "12",
                                      "explanation": "Sample explanation."
                                    }
                                  ],
                                  "starterCodes": {
                                    "JAVA": "public class Solution { public static long solve(long n) { return 0L; } }",
                                    "PYTHON": "n = int(input().strip())\\nprint(0)"
                                  }
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.constraints").value("1 <= n <= 1000"))
                .andExpect(jsonPath("$.inputFormat").value("A single integer n."))
                .andExpect(jsonPath("$.outputFormat").value("Print the answer."))
                .andExpect(jsonPath("$.hintTitle").value("Start small"))
                .andExpect(jsonPath("$.hintContent").value("Try the first few terms manually."))
                .andExpect(jsonPath("$.memoryLimitMb").value(320))
                .andExpect(jsonPath("$.hintAvailable").value(true))
                .andExpect(jsonPath("$.hintUnlocked").value(true))
                .andExpect(jsonPath("$.editorialTitle").value("Closed form"))
                .andExpect(jsonPath("$.editorialContent").value("Use the arithmetic series formula."))
                .andExpect(jsonPath("$.editorialAvailable").value(true))
                .andExpect(jsonPath("$.editorialUnlocked").value(true))
                .andExpect(jsonPath("$.viewerSolved").value(false))
                .andExpect(jsonPath("$.viewerStatus").value("NOT_STARTED"))
                .andExpect(jsonPath("$.tags[0]").value("math"))
                .andExpect(jsonPath("$.tags[1]").value("dp"))
                .andExpect(jsonPath("$.examples[0].input").value("5"))
                .andExpect(jsonPath("$.examples[0].output").value("12"))
                .andExpect(jsonPath("$.examples[0].explanation").value("Sample explanation."))
                .andExpect(jsonPath("$.starterCodes.JAVA").exists())
                .andExpect(jsonPath("$.starterCodes.PYTHON").exists());
    }

    @Test
    void createProblemRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/problems")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Unauthorized Problem",
                                  "description": "Should fail without auth.",
                                  "difficulty": "EASY"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void seededCatalogSupportsLongMultilineTestCases() {
        Problem problem = problemRepository.findByTitleIgnoreCase("Maximum Path Sum I")
                .orElseThrow();

        boolean hasLongCase = testCaseRepository.findByProblem_Id(problem.getId()).stream()
                .anyMatch(testCase -> testCase.getInput() != null && testCase.getInput().length() > 255);

        org.junit.jupiter.api.Assertions.assertTrue(
                hasLongCase,
                "Seeded catalog should preserve long multiline testcase inputs."
        );
    }

    @Test
    void problemHintAndEditorialStayLockedForAnonymousViewer() throws Exception {
        Problem problem = problemWithGuidance("Locked Editorial");
        problem = problemRepository.save(problem);

        mockMvc.perform(get("/api/problems/{id}", problem.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hintAvailable").value(true))
                .andExpect(jsonPath("$.hintUnlocked").value(false))
                .andExpect(jsonPath("$.hintTitle").isEmpty())
                .andExpect(jsonPath("$.hintContent").isEmpty())
                .andExpect(jsonPath("$.editorialAvailable").value(true))
                .andExpect(jsonPath("$.editorialUnlocked").value(false))
                .andExpect(jsonPath("$.viewerSolved").value(false))
                .andExpect(jsonPath("$.viewerStatus").isEmpty())
                .andExpect(jsonPath("$.editorialTitle").isEmpty())
                .andExpect(jsonPath("$.editorialContent").isEmpty());
    }

    @Test
    void problemHintUnlocksAfterFirstSubmissionButEditorialStaysLocked() throws Exception {
        Problem problem = problemWithGuidance("Hint First");
        problem = problemRepository.save(problem);
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        submissionRepository.save(submission(problem, demoUser, SubmissionStatus.WRONG_ANSWER));
        String demoToken = login("demo", "demo123");

        mockMvc.perform(get("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hintAvailable").value(true))
                .andExpect(jsonPath("$.hintUnlocked").value(true))
                .andExpect(jsonPath("$.hintTitle").value("First nudge"))
                .andExpect(jsonPath("$.hintContent").value("Look for a repeating arithmetic pattern."))
                .andExpect(jsonPath("$.editorialAvailable").value(true))
                .andExpect(jsonPath("$.editorialUnlocked").value(false))
                .andExpect(jsonPath("$.editorialTitle").isEmpty())
                .andExpect(jsonPath("$.editorialContent").isEmpty())
                .andExpect(jsonPath("$.viewerSolved").value(false))
                .andExpect(jsonPath("$.viewerStatus").value("WRONG_ANSWER"));
    }

    @Test
    void problemEditorialUnlocksForAcceptedOwner() throws Exception {
        Problem problem = problemWithGuidance("Unlocked Editorial");
        problem = problemRepository.save(problem);
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        submissionRepository.save(submission(problem, demoUser));
        String demoToken = login("demo", "demo123");

        mockMvc.perform(get("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hintAvailable").value(true))
                .andExpect(jsonPath("$.hintUnlocked").value(true))
                .andExpect(jsonPath("$.hintTitle").value("First nudge"))
                .andExpect(jsonPath("$.hintContent").value("Look for a repeating arithmetic pattern."))
                .andExpect(jsonPath("$.editorialAvailable").value(true))
                .andExpect(jsonPath("$.editorialUnlocked").value(true))
                .andExpect(jsonPath("$.viewerSolved").value(true))
                .andExpect(jsonPath("$.viewerStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.editorialTitle").value("Accepted route"))
                .andExpect(jsonPath("$.editorialContent").value("Walk through the number theory shortcut."));
    }

    @Test
    void problemEditorialIsVisibleToAdminWithoutAcceptedSubmission() throws Exception {
        Problem problem = problemWithGuidance("Admin Editorial");
        problem = problemRepository.save(problem);
        String adminToken = login("admin", "admin123");

        mockMvc.perform(get("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hintAvailable").value(true))
                .andExpect(jsonPath("$.hintUnlocked").value(true))
                .andExpect(jsonPath("$.hintTitle").value("First nudge"))
                .andExpect(jsonPath("$.hintContent").value("Look for a repeating arithmetic pattern."))
                .andExpect(jsonPath("$.editorialAvailable").value(true))
                .andExpect(jsonPath("$.editorialUnlocked").value(true))
                .andExpect(jsonPath("$.viewerSolved").value(false))
                .andExpect(jsonPath("$.viewerStatus").value("NOT_STARTED"))
                .andExpect(jsonPath("$.editorialTitle").value("Accepted route"))
                .andExpect(jsonPath("$.editorialContent").value("Walk through the number theory shortcut."));
    }

    @Test
    void problemListUsesLatestViewerAttemptWhenProblemIsNotSolved() throws Exception {
        Problem problem = problem("Viewer Attempt");
        problem = problemRepository.save(problem);
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        submissionRepository.save(submission(problem, demoUser, SubmissionStatus.WRONG_ANSWER));
        String demoToken = login("demo", "demo123");

        mockMvc.perform(get("/api/problems?page=0&size=20&title=Viewer Attempt")
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].viewerSolved").value(false))
                .andExpect(jsonPath("$.content[0].viewerStatus").value("WRONG_ANSWER"));
    }

    @Test
    void updateProblemPersistsNewFields() throws Exception {
        Problem problem = problemRepository.save(problem("Old Title"));
        String adminToken = login("admin", "admin123");

        mockMvc.perform(put("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Updated Title",
                                  "description": "Updated description.",
                                  "constraints": "n is positive",
                                  "inputFormat": "One integer n.",
                                  "outputFormat": "One integer answer.",
                                  "hintTitle": "Updated hint",
                                  "hintContent": "Try a formula first.",
                                  "difficulty": "HARD",
                                  "timeLimitMs": 750,
                                  "memoryLimitMb": 192,
                                  "tags": ["graphs", "search"],
                                  "examples": [
                                    {
                                      "input": "7",
                                      "output": "42",
                                      "explanation": "Updated sample."
                                    }
                                  ],
                                  "starterCodes": {
                                    "CPP": "#include <iostream>\\nint main() { return 0; }"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.difficulty").value("HARD"))
                .andExpect(jsonPath("$.timeLimitMs").value(750))
                .andExpect(jsonPath("$.memoryLimitMb").value(192))
                .andExpect(jsonPath("$.constraints").value("n is positive"))
                .andExpect(jsonPath("$.inputFormat").value("One integer n."))
                .andExpect(jsonPath("$.outputFormat").value("One integer answer."))
                .andExpect(jsonPath("$.hintTitle").value("Updated hint"))
                .andExpect(jsonPath("$.hintContent").value("Try a formula first."))
                .andExpect(jsonPath("$.tags[0]").value("graphs"))
                .andExpect(jsonPath("$.tags[1]").value("search"))
                .andExpect(jsonPath("$.examples[0].input").value("7"))
                .andExpect(jsonPath("$.starterCodes.CPP").exists());
    }

    @Test
    void bulkCreateProblemsCreatesMultipleEntries() throws Exception {
        String adminToken = login("admin", "admin123");

        mockMvc.perform(post("/api/problems/bulk")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problems": [
                                    {
                                      "title": "Bulk One",
                                      "description": "Bulk payload one.",
                                      "difficulty": "EASY",
                                      "inputFormat": "Single integer.",
                                      "outputFormat": "Single answer.",
                                      "testCases": [
                                        {
                                          "input": "5",
                                          "expectedOutput": "6",
                                          "hidden": false
                                        }
                                      ],
                                      "starterCodes": {
                                        "JAVA": "public class Solution {}"
                                      }
                                    },
                                    {
                                      "title": "Bulk Two",
                                      "description": "Bulk payload two.",
                                      "difficulty": "MEDIUM",
                                      "tags": ["math"]
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Bulk One"))
                .andExpect(jsonPath("$[0].testCaseCount").value(1))
                .andExpect(jsonPath("$[1].title").value("Bulk Two"));
    }

    @Test
    void seededCatalogContainsMultipleStarterProblems() throws Exception {
        mockMvc.perform(get("/api/problems?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.title == 'Multiples of 3 or 5')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Even Fibonacci Sum')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Largest Prime Factor')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Smallest Multiple')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Lattice Paths')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Power Digit Sum')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Coin Sums')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Maximum Path Sum I')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Spiral Diagonal Sum')]").exists())
                .andExpect(jsonPath("$.content[?(@.title == 'Highly Divisible Triangle')]").exists());
    }

    @Test
    void deleteProblemRemovesProblemWhenItHasNoSubmissions() throws Exception {
        Problem problem = problemRepository.save(problem("Disposable Problem"));
        String adminToken = login("admin", "admin123");

        mockMvc.perform(delete("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertFalse(problemRepository.existsById(problem.getId()));
    }

    @Test
    void deleteProblemReturnsConflictWhenSubmissionsExist() throws Exception {
        Problem problem = problemRepository.save(problem("Protected Problem"));
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        submissionRepository.save(submission(problem, demoUser));
        String adminToken = login("admin", "admin123");

        mockMvc.perform(delete("/api/problems/{id}", problem.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Problem cannot be deleted while submissions exist for id: " + problem.getId()));
    }

    private Problem problem(String title) {
        Problem problem = new Problem();
        problem.setTitle(title);
        problem.setDescription("Problem description");
        problem.setDifficulty(Difficulty.EASY);
        return problem;
    }

    private Problem problemWithGuidance(String title) {
        Problem problem = problem(title);
        problem.setHintTitle("First nudge");
        problem.setHintContent("Look for a repeating arithmetic pattern.");
        problem.setEditorialTitle("Accepted route");
        problem.setEditorialContent("Walk through the number theory shortcut.");
        return problem;
    }

    private Submission submission(Problem problem, UserAccount user) {
        return submission(problem, user, SubmissionStatus.ACCEPTED);
    }

    private Submission submission(Problem problem, UserAccount user, SubmissionStatus status) {
        Submission submission = new Submission();
        submission.setProblem(problem);
        submission.setUser(user);
        submission.setLanguage(ProgrammingLanguage.JAVA);
        submission.setSourceCode("public class Solution {}");
        submission.setStatus(status);
        submission.setCreatedAt(LocalDateTime.now());
        submission.setJudgedAt(LocalDateTime.now());
        submission.setPassedTestCount(status == SubmissionStatus.ACCEPTED ? 1 : 0);
        submission.setTotalTestCount(1);
        submission.setExecutionTime(10);
        submission.setMemoryUsage(32);
        return submission;
    }

    private String login(String username, String password) throws Exception {
        JsonNode response = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "username": "%s",
                                          "password": "%s"
                                        }
                                        """.formatted(username, password)))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        return response.get("token").asText();
    }
}
