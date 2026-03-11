package com.altern.dashboard;

import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
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

        testCaseRepository.save(testCase(solvedProblem, "10", "23", false));
        testCaseRepository.save(testCase(attemptedProblem, "10", "23", false));

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

        assertEquals(2, submissionRepository.count());

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo"))
                .andExpect(jsonPath("$.totalProblems").value(totalProblemsBefore + 2))
                .andExpect(jsonPath("$.solvedProblems").value(1))
                .andExpect(jsonPath("$.attemptedProblems").value(2))
                .andExpect(jsonPath("$.remainingProblems").value(totalProblemsBefore + 1))
                .andExpect(jsonPath("$.totalSubmissions").value(2))
                .andExpect(jsonPath("$.acceptedSubmissions").value(1))
                .andExpect(jsonPath("$.acceptanceRate").value(50))
                .andExpect(jsonPath("$.mostUsedLanguage").value("JAVA"))
                .andExpect(jsonPath("$.languageBreakdown.JAVA").value(2))
                .andExpect(jsonPath("$.languageBreakdown.PYTHON").value(0))
                .andExpect(jsonPath("$.languageBreakdown.CPP").value(0))
                .andExpect(jsonPath("$.solvedByDifficulty.EASY").value(1))
                .andExpect(jsonPath("$.solvedByDifficulty.MEDIUM").value(0))
                .andExpect(jsonPath("$.continueAttempt.problemId").value(attemptedProblem.getId()))
                .andExpect(jsonPath("$.continueAttempt.problemTitle").value("Dashboard Attempted"))
                .andExpect(jsonPath("$.continueAttempt.status").value("WRONG_ANSWER"))
                .andExpect(jsonPath("$.continueAttempt.submissionId").isNumber())
                .andExpect(jsonPath("$.continueAttempt.lastActivityAt").isNotEmpty())
                .andExpect(jsonPath("$.recentAttempted", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.recentAttempted[0].problemId").value(attemptedProblem.getId()))
                .andExpect(jsonPath("$.recentAttempted[0].status").value("WRONG_ANSWER"))
                .andExpect(jsonPath("$.suggestedProblem.problemId").isNumber())
                .andExpect(jsonPath("$.suggestedProblem.problemTitle").isNotEmpty())
                .andExpect(jsonPath("$.suggestedProblem.difficulty").isNotEmpty())
                .andExpect(jsonPath("$.suggestedProblem.status").isNotEmpty())
                .andExpect(jsonPath("$.recentAccepted", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.recentAccepted[0].problemId").value(solvedProblem.getId()))
                .andExpect(jsonPath("$.recentAccepted[0].problemTitle").value("Dashboard Solved"))
                .andExpect(jsonPath("$.recentAccepted[0].language").value("JAVA"))
                .andExpect(jsonPath("$.recentAccepted[0].acceptedAt").isNotEmpty());
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
