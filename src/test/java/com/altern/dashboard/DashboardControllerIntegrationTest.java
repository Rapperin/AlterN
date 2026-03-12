package com.altern.dashboard;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.repository.UserAccountRepository;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DashboardControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private TestCaseRepository testCaseRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Test
    void dashboardEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void dashboardEndpointReturnsUserProgressSummaryAndRecentAccepted() throws Exception {
        String token = login("demo", "demo123");
        long totalProblemsBefore = problemRepository.count();

        Problem solvedProblem = problemRepository.save(problem("Dashboard Solved", Difficulty.EASY));
        Problem attemptedProblem = problemRepository.save(problem("Dashboard Attempted", Difficulty.MEDIUM));
        Problem bookmarkedProblem = problemRepository.save(problem("Dashboard Bookmarked", Difficulty.HARD));

        testCaseRepository.save(testCase(solvedProblem, "10", "23", false));
        testCaseRepository.save(testCase(attemptedProblem, "10", "23", false));
        testCaseRepository.save(testCase(bookmarkedProblem, "7", "14", false));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { int total = 0; for (int i = 0; i < n; i++) { if (i %% 3 == 0 || i %% 5 == 0) { total += i; } } return total; } }"
                                }
                                """.formatted(solvedProblem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 0; } }"
                                }
                                """.formatted(attemptedProblem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WRONG_ANSWER"));

        mockMvc.perform(post("/api/problems/{id}/bookmark", bookmarkedProblem.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertEquals(2, submissionRepository.count());

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo"))
                .andExpect(jsonPath("$.totalProblems").value(totalProblemsBefore + 3))
                .andExpect(jsonPath("$.solvedProblems").value(1))
                .andExpect(jsonPath("$.attemptedProblems").value(2))
                .andExpect(jsonPath("$.remainingProblems").value(totalProblemsBefore + 2))
                .andExpect(jsonPath("$.totalSubmissions").value(2))
                .andExpect(jsonPath("$.acceptedSubmissions").value(1))
                .andExpect(jsonPath("$.pendingSubmissions").value(0))
                .andExpect(jsonPath("$.acceptanceRate").value(50))
                .andExpect(jsonPath("$.mostUsedLanguage").value("JAVA"))
                .andExpect(jsonPath("$.mostSuccessfulLanguage").value("JAVA"))
                .andExpect(jsonPath("$.bookmarkedProblems").value(1))
                .andExpect(jsonPath("$.activeDays").value(1))
                .andExpect(jsonPath("$.currentAcceptedStreakDays").value(1))
                .andExpect(jsonPath("$.longestAcceptedStreakDays").value(1))
                .andExpect(jsonPath("$.languageBreakdown.JAVA").value(2))
                .andExpect(jsonPath("$.languageBreakdown.PYTHON").value(0))
                .andExpect(jsonPath("$.languageBreakdown.CPP").value(0))
                .andExpect(jsonPath("$.acceptedLanguageBreakdown.JAVA").value(1))
                .andExpect(jsonPath("$.acceptedLanguageBreakdown.PYTHON").value(0))
                .andExpect(jsonPath("$.acceptedLanguageBreakdown.CPP").value(0))
                .andExpect(jsonPath("$.solvedByDifficulty.EASY").value(1))
                .andExpect(jsonPath("$.solvedByDifficulty.MEDIUM").value(0))
                .andExpect(jsonPath("$.continueAttempt.problemId").value(attemptedProblem.getId()))
                .andExpect(jsonPath("$.continueAttempt.problemTitle").value("Dashboard Attempted"))
                .andExpect(jsonPath("$.continueAttempt.status").value("WRONG_ANSWER"))
                .andExpect(jsonPath("$.continueAttempt.submissionId").isNumber())
                .andExpect(jsonPath("$.continueAttempt.lastActivityAt").isNotEmpty())
                .andExpect(jsonPath("$.recentAttempted", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.recentPending", Matchers.hasSize(0)))
                .andExpect(jsonPath("$.recentAttempted[0].problemId").value(attemptedProblem.getId()))
                .andExpect(jsonPath("$.recentAttempted[0].status").value("WRONG_ANSWER"))
                .andExpect(jsonPath("$.suggestedProblem.problemId").value(bookmarkedProblem.getId()))
                .andExpect(jsonPath("$.suggestedProblem.problemTitle").value("Dashboard Bookmarked"))
                .andExpect(jsonPath("$.suggestedProblem.difficulty").value("HARD"))
                .andExpect(jsonPath("$.suggestedProblem.status").value("BOOKMARKED"))
                .andExpect(jsonPath("$.recentBookmarked", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.recentBookmarked[0].problemId").value(bookmarkedProblem.getId()))
                .andExpect(jsonPath("$.recentBookmarked[0].problemTitle").value("Dashboard Bookmarked"))
                .andExpect(jsonPath("$.recentBookmarked[0].difficulty").value("HARD"))
                .andExpect(jsonPath("$.recentBookmarked[0].status").value("BOOKMARKED"))
                .andExpect(jsonPath("$.recentBookmarked[0].bookmarkedAt").isNotEmpty())
                .andExpect(jsonPath("$.recentActivity", Matchers.hasSize(14)))
                .andExpect(jsonPath("$.recentActivity[13].submissions").value(2))
                .andExpect(jsonPath("$.recentActivity[13].accepted").value(1))
                .andExpect(jsonPath("$.achievements", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.achievements[0].code").value("FIRST_ACCEPTED"))
                .andExpect(jsonPath("$.achievements[0].title").value("First Accepted"))
                .andExpect(jsonPath("$.journey.level").value(2))
                .andExpect(jsonPath("$.journey.title").value("Rookie"))
                .andExpect(jsonPath("$.journey.solvedProblems").value(1))
                .andExpect(jsonPath("$.journey.nextLevel").value(3))
                .andExpect(jsonPath("$.journey.nextTitle").value("Builder"))
                .andExpect(jsonPath("$.journey.nextSolvedTarget").value(3))
                .andExpect(jsonPath("$.journey.progressPercent").value(0))
                .andExpect(jsonPath("$.journey.nextGoals[*].code", Matchers.contains("HARD_SOLVER", "COMEBACK", "STREAK_3")))
                .andExpect(jsonPath("$.journeyFocus.problemId").value(bookmarkedProblem.getId()))
                .andExpect(jsonPath("$.journeyFocus.problemTitle").value("Dashboard Bookmarked"))
                .andExpect(jsonPath("$.journeyFocus.goalCode").value("HARD_SOLVER"))
                .andExpect(jsonPath("$.journeyFocus.goalTitle").value("Hard Things"))
                .andExpect(jsonPath("$.journeyFocus.status").value("BOOKMARKED"))
                .andExpect(jsonPath("$.journeyFocus.reason", Matchers.containsString("hard problem")))
                .andExpect(jsonPath("$.recentAccepted", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.recentAccepted[0].problemId").value(solvedProblem.getId()))
                .andExpect(jsonPath("$.recentAccepted[0].problemTitle").value("Dashboard Solved"))
                .andExpect(jsonPath("$.recentAccepted[0].language").value("JAVA"))
                .andExpect(jsonPath("$.recentAccepted[0].acceptedAt").isNotEmpty());
    }

    @Test
    void dashboardJourneyFocusSuggestsLanguageForPolyglotGoal() throws Exception {
        String token = login("demo", "demo123");
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();

        Problem hardProblem = problemRepository.save(problem("Journey Hard", Difficulty.HARD));
        Problem easyProblem = problemRepository.save(problem("Journey Easy", Difficulty.EASY));

        submissionRepository.save(submission(
                demoUser,
                hardProblem,
                SubmissionStatus.WRONG_ANSWER,
                ProgrammingLanguage.JAVA,
                null,
                null,
                LocalDateTime.now().minusDays(3)
        ));
        submissionRepository.save(submission(
                demoUser,
                hardProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.JAVA,
                18,
                32,
                LocalDateTime.now().minusDays(2)
        ));
        submissionRepository.save(submission(
                demoUser,
                easyProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.PYTHON,
                9,
                20,
                LocalDateTime.now().minusDays(1)
        ));
        submissionRepository.save(submission(
                demoUser,
                easyProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.PYTHON,
                8,
                18,
                LocalDateTime.now().minusHours(2)
        ));

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.journey.nextGoals[0].code").value("POLYGLOT"))
                .andExpect(jsonPath("$.mostSuccessfulLanguage").value("PYTHON"))
                .andExpect(jsonPath("$.journeyFocus.goalCode").value("POLYGLOT"))
                .andExpect(jsonPath("$.journeyFocus.problemId").value(Matchers.anyOf(
                        Matchers.is(hardProblem.getId().intValue()),
                        Matchers.is(easyProblem.getId().intValue())
                )))
                .andExpect(jsonPath("$.journeyFocus.suggestedLanguage").value(Matchers.anyOf(
                        Matchers.is("JAVA"),
                        Matchers.is("CPP")
                )))
                .andExpect(jsonPath("$.journeyFocus.reason", Matchers.containsString("yeni bir dil")));
    }

    @Test
    void dashboardEndpointReturnsPendingQueueSummary() throws Exception {
        String token = login("demo", "demo123");
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();

        Problem pendingProblem = problemRepository.save(problem("Dashboard Pending", Difficulty.MEDIUM));
        Problem acceptedProblem = problemRepository.save(problem("Dashboard Accepted", Difficulty.EASY));

        submissionRepository.save(submission(
                demoUser,
                pendingProblem,
                SubmissionStatus.PENDING,
                ProgrammingLanguage.JAVA,
                null,
                null,
                null,
                LocalDateTime.now().minusMinutes(1)
        ));
        submissionRepository.save(submission(
                demoUser,
                acceptedProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.PYTHON,
                11,
                22,
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now().minusHours(2)
        ));

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingSubmissions").value(1))
                .andExpect(jsonPath("$.recentPending", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.recentPending[0].problemId").value(pendingProblem.getId()))
                .andExpect(jsonPath("$.recentPending[0].problemTitle").value("Dashboard Pending"))
                .andExpect(jsonPath("$.recentPending[0].status").value("PENDING"))
                .andExpect(jsonPath("$.recentPending[0].language").value("JAVA"))
                .andExpect(jsonPath("$.recentPending[0].lastActivityAt").isNotEmpty());
    }

    private Problem problem(String title, Difficulty difficulty) {
        Problem problem = new Problem();
        problem.setTitle(title);
        problem.setDescription("Dashboard problem");
        problem.setDifficulty(difficulty);
        return problem;
    }

    private TestCase testCase(Problem problem, String input, String expectedOutput, boolean hidden) {
        TestCase testCase = new TestCase();
        testCase.setProblem(problem);
        testCase.setInput(input);
        testCase.setExpectedOutput(expectedOutput);
        testCase.setHidden(hidden);
        return testCase;
    }

    private Submission submission(
            UserAccount user,
            Problem problem,
            SubmissionStatus status,
            ProgrammingLanguage language,
            Integer executionTime,
            Integer memoryUsage,
            LocalDateTime judgedAt
    ) {
        return submission(user, problem, status, language, executionTime, memoryUsage, judgedAt, judgedAt == null ? LocalDateTime.now() : judgedAt.minusSeconds(5));
    }

    private Submission submission(
            UserAccount user,
            Problem problem,
            SubmissionStatus status,
            ProgrammingLanguage language,
            Integer executionTime,
            Integer memoryUsage,
            LocalDateTime judgedAt,
            LocalDateTime createdAt
    ) {
        Submission submission = new Submission();
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setLanguage(language);
        submission.setSourceCode("code");
        submission.setStatus(status);
        submission.setCreatedAt(createdAt);
        submission.setJudgedAt(judgedAt);
        submission.setExecutionTime(executionTime);
        submission.setMemoryUsage(memoryUsage);
        submission.setPassedTestCount(status == SubmissionStatus.ACCEPTED ? 1 : 0);
        submission.setTotalTestCount(1);
        submission.setVerdictMessage(status.name());
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
