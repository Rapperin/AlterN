package com.altern.submission;

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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SubmissionControllerIntegrationTest {

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
    void submissionJudgeUsesHiddenTestCasesAndReturnsRichSubmissionDetails() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Sum Square Difference"));
        testCaseRepository.save(testCase(problem, "10", "23", false));
        testCaseRepository.save(testCase(problem, "1000", "233168", true));

        MvcResult result = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { int total = 0; for (int i = 0; i < n; i++) { if (i %% 3 == 0 || i %% 5 == 0) { total += i; } } return total; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problemId").value(problem.getId()))
                .andExpect(jsonPath("$.problemTitle").value("Sum Square Difference"))
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.passedTestCount").value(2))
                .andExpect(jsonPath("$.totalTestCount").value(2))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.judgedAt").isNotEmpty())
                .andExpect(jsonPath("$.executionTime").isNumber())
                .andExpect(jsonPath("$.memoryUsage").isNumber())
                .andExpect(jsonPath("$.verdictMessage").value(org.hamcrest.Matchers.nullValue()))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        long submissionId = body.get("id").asLong();

        mockMvc.perform(get("/api/submissions/{id}", submissionId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(submissionId))
                .andExpect(jsonPath("$.judgedAt").isNotEmpty())
                .andExpect(jsonPath("$.sourceCode").value(Matchers.containsString("solve")))
                .andExpect(jsonPath("$.executionTime").isNumber())
                .andExpect(jsonPath("$.memoryUsage").isNumber())
                .andExpect(jsonPath("$.failedTestIndex").doesNotExist())
                .andExpect(jsonPath("$.verdictMessage").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void submissionDetailReturnsVisibleFailureDiagnostics() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Visible Failure Detail"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        MvcResult result = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 0; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WRONG_ANSWER"))
                .andReturn();

        long submissionId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/submissions/{id}", submissionId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.failedTestIndex").value(1))
                .andExpect(jsonPath("$.failedVisible").value(true))
                .andExpect(jsonPath("$.failedInputPreview").value("10"))
                .andExpect(jsonPath("$.failedExpectedOutputPreview").value("23"))
                .andExpect(jsonPath("$.failedActualOutputPreview").value("0"))
                .andExpect(jsonPath("$.verdictMessage").value("Wrong answer. Visible test case failed."));
    }

    @Test
    void submissionDetailHidesHiddenFailureDiagnostics() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Hidden Failure Detail"));
        testCaseRepository.save(testCase(problem, "10", "23", false));
        testCaseRepository.save(testCase(problem, "1000", "233168", true));

        MvcResult result = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { if (n == 10) { return 23; } return 0; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WRONG_ANSWER"))
                .andReturn();

        long submissionId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/submissions/{id}", submissionId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.failedTestIndex").value(2))
                .andExpect(jsonPath("$.failedVisible").value(false))
                .andExpect(jsonPath("$.failedInputPreview").doesNotExist())
                .andExpect(jsonPath("$.failedExpectedOutputPreview").doesNotExist())
                .andExpect(jsonPath("$.failedActualOutputPreview").doesNotExist())
                .andExpect(jsonPath("$.verdictMessage").value("Wrong answer. Hidden test case failed."));
    }

    @Test
    void invalidLanguageDoesNotPersistPendingSubmission() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Language Validation"));

                mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "RUBY",
                                  "sourceCode": "public class Solution {}"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid programming language: RUBY"));

        assertEquals(0, submissionRepository.count());
    }

    @Test
    void invalidJavaSubmissionReturnsCompilationError() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Compilation Error"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return ; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPILATION_ERROR"))
                .andExpect(jsonPath("$.verdictMessage").isNotEmpty());
    }

    @Test
    void throwingJavaSubmissionReturnsRuntimeError() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Runtime Error"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { throw new RuntimeException(\\\"boom\\\"); } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RUNTIME_ERROR"))
                .andExpect(jsonPath("$.verdictMessage").value(org.hamcrest.Matchers.containsString("boom")));
    }

    @Test
    void infiniteLoopJavaSubmissionReturnsTimeLimitExceeded() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problem("Time Limit");
        problem.setTimeLimitMs(200);
        problem = problemRepository.save(problem);
        testCaseRepository.save(testCase(problem, "10", "23", false));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { while (true) { } } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TIME_LIMIT_EXCEEDED"))
                .andExpect(jsonPath("$.executionTime").isNumber())
                .andExpect(jsonPath("$.memoryUsage").isNumber())
                .andExpect(jsonPath("$.verdictMessage").value(org.hamcrest.Matchers.containsString("timed out")));
    }

    @Test
    void validPythonSubmissionReturnsAccepted() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Python Accepted"));
        testCaseRepository.save(testCase(problem, "10", "23", false));
        testCaseRepository.save(testCase(problem, "1000", "233168", true));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "PYTHON",
                                  "sourceCode": "n = int(input().strip())\\ntotal = sum(i for i in range(n) if i %% 3 == 0 or i %% 5 == 0)\\nprint(total)"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.passedTestCount").value(2))
                .andExpect(jsonPath("$.verdictMessage").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void validCppSubmissionReturnsAccepted() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Cpp Accepted"));
        testCaseRepository.save(testCase(problem, "10", "23", false));
        testCaseRepository.save(testCase(problem, "1000", "233168", true));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "CPP",
                                  "sourceCode": "#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    long long n;\\n    cin >> n;\\n    long long total = 0;\\n    for (long long i = 0; i < n; i++) {\\n        if (i %% 3 == 0 || i %% 5 == 0) {\\n            total += i;\\n        }\\n    }\\n    cout << total;\\n    return 0;\\n}"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.passedTestCount").value(2))
                .andExpect(jsonPath("$.verdictMessage").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void createSubmissionRequiresAuthentication() throws Exception {
        Problem problem = problemRepository.save(problem("Protected Submission"));

        mockMvc.perform(post("/api/submissions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution {}"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void submissionsEndpointReturnsOnlyCurrentUsersOwnSubmissions() throws Exception {
        Problem problem = problemRepository.save(problem("Owned Submissions"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        String demoToken = login("demo", "demo123");
        String aliceToken = registerAndGetToken("alice" + System.nanoTime(), "secret123");

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + demoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { int total = 0; for (int i = 0; i < n; i++) { if (i %% 3 == 0 || i %% 5 == 0) { total += i; } } return total; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { int total = 0; for (int i = 0; i < n; i++) { if (i %% 3 == 0 || i %% 5 == 0) { total += i; } } return total; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/submissions?page=0&size=10")
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.content[0].problemId").value(problem.getId()));
    }

    @Test
    void submissionDetailEndpointDoesNotExposeAnotherUsersSourceCode() throws Exception {
        Problem problem = problemRepository.save(problem("Owned Detail"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        String demoToken = login("demo", "demo123");
        String aliceToken = registerAndGetToken("alice-detail" + System.nanoTime(), "secret123");

        MvcResult result = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + demoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 23; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andReturn();

        long submissionId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/submissions/{id}", submissionId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void workspaceEndpointRequiresAuthentication() throws Exception {
        Problem problem = problemRepository.save(problem("Workspace Protected"));

        mockMvc.perform(get("/api/workspace/problems/{problemId}", problem.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void workspaceReplayEndpointRequiresAuthentication() throws Exception {
        Problem problem = problemRepository.save(problem("Replay Protected"));

        mockMvc.perform(post("/api/workspace/problems/{problemId}/replay", problem.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return n; } }",
                                  "input": "10"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void workspaceCompareEndpointRequiresAuthentication() throws Exception {
        Problem problem = problemRepository.save(problem("Compare Protected"));

        mockMvc.perform(post("/api/workspace/problems/{problemId}/compare", problem.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "baselineSubmissionId": 1,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return n; } }",
                                  "input": "10"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void workspaceEndpointReturnsAttemptBreakdownAndLastAcceptedSnapshot() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Workspace Summary"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 0; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WRONG_ANSWER"));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { int total = 0; for (int i = 0; i < n; i++) { if (i %% 3 == 0 || i %% 5 == 0) { total += i; } } return total; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mockMvc.perform(get("/api/workspace/problems/{problemId}", problem.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problemId").value(problem.getId()))
                .andExpect(jsonPath("$.attemptCount").value(2))
                .andExpect(jsonPath("$.acceptedCount").value(1))
                .andExpect(jsonPath("$.solved").value(true))
                .andExpect(jsonPath("$.lastSubmissionId").isNumber())
                .andExpect(jsonPath("$.lastStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.lastSubmissionLanguage").value("JAVA"))
                .andExpect(jsonPath("$.lastSubmittedAt").isNotEmpty())
                .andExpect(jsonPath("$.lastAcceptedSubmissionId").isNumber())
                .andExpect(jsonPath("$.lastAcceptedAt").isNotEmpty())
                .andExpect(jsonPath("$.lastAcceptedLanguage").value("JAVA"))
                .andExpect(jsonPath("$.lastAcceptedExecutionTime").isNumber())
                .andExpect(jsonPath("$.lastAcceptedMemoryUsage").isNumber())
                .andExpect(jsonPath("$.failureBreakdown.WRONG_ANSWER").value(1));
    }

    @Test
    void workspaceEndpointReturnsLatestVisibleFailureDiagnostics() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Workspace Failure Detail"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 0; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WRONG_ANSWER"));

        mockMvc.perform(get("/api/workspace/problems/{problemId}", problem.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastStatus").value("WRONG_ANSWER"))
                .andExpect(jsonPath("$.lastVerdictMessage").value("Wrong answer. Visible test case failed."))
                .andExpect(jsonPath("$.lastFailedTestIndex").value(1))
                .andExpect(jsonPath("$.lastFailedVisible").value(true))
                .andExpect(jsonPath("$.lastFailedInputPreview").value("10"))
                .andExpect(jsonPath("$.lastFailedExpectedOutputPreview").value("23"))
                .andExpect(jsonPath("$.lastFailedActualOutputPreview").value("0"));
    }

    @Test
    void workspaceReplayExecutesCurrentEditorCodeAgainstCustomInput() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Workspace Replay"));

        mockMvc.perform(post("/api/workspace/problems/{problemId}/replay", problem.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { int total = 0; for (int i = 0; i < n; i++) { if (i % 3 == 0 || i % 5 == 0) { total += i; } } return total; } }",
                                  "input": "10",
                                  "expectedOutput": "23"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problemId").value(problem.getId()))
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.output").value("23"))
                .andExpect(jsonPath("$.expectedOutput").value("23"))
                .andExpect(jsonPath("$.matchedExpected").value(true))
                .andExpect(jsonPath("$.executionTime").isNumber())
                .andExpect(jsonPath("$.memoryUsage").isNumber());
    }

    @Test
    void workspaceCompareExecutesCurrentAndBaselineSubmissionAgainstSameInput() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Workspace Compare"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        MvcResult baselineResult = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 0; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WRONG_ANSWER"))
                .andReturn();

        long baselineSubmissionId = objectMapper.readTree(baselineResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/workspace/problems/{problemId}/compare", problem.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "baselineSubmissionId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { int total = 0; for (int i = 0; i < n; i++) { if (i %% 3 == 0 || i %% 5 == 0) { total += i; } } return total; } }",
                                  "input": "10",
                                  "expectedOutput": "23"
                                }
                                """.formatted(baselineSubmissionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problemId").value(problem.getId()))
                .andExpect(jsonPath("$.expectedOutput").value("23"))
                .andExpect(jsonPath("$.sameOutput").value(false))
                .andExpect(jsonPath("$.currentRun.status").value("SUCCESS"))
                .andExpect(jsonPath("$.currentRun.output").value("23"))
                .andExpect(jsonPath("$.currentRun.matchedExpected").value(true))
                .andExpect(jsonPath("$.baselineRun.submissionId").value(baselineSubmissionId))
                .andExpect(jsonPath("$.baselineRun.language").value("JAVA"))
                .andExpect(jsonPath("$.baselineRun.status").value("SUCCESS"))
                .andExpect(jsonPath("$.baselineRun.output").value("0"))
                .andExpect(jsonPath("$.baselineRun.matchedExpected").value(false));
    }

    @Test
    void workspaceCompareRejectsBaselineSubmissionFromAnotherProblem() throws Exception {
        String userToken = login("demo", "demo123");
        Problem compareProblem = problemRepository.save(problem("Compare Problem"));
        Problem otherProblem = problemRepository.save(problem("Other Problem"));
        testCaseRepository.save(testCase(otherProblem, "10", "23", false));

        MvcResult baselineResult = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 0; } }"
                                }
                                """.formatted(otherProblem.getId())))
                .andExpect(status().isOk())
                .andReturn();

        long baselineSubmissionId = objectMapper.readTree(baselineResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/workspace/problems/{problemId}/compare", compareProblem.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "baselineSubmissionId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 23; } }",
                                  "input": "10"
                                }
                                """.formatted(baselineSubmissionId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Selected submission does not belong to this problem."));
    }

    private Problem problem(String title) {
        Problem problem = new Problem();
        problem.setTitle(title);
        problem.setDescription("Problem description");
        problem.setDifficulty(Difficulty.EASY);
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

    private String registerAndGetToken(String username, String password) throws Exception {
        JsonNode response = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/register")
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
