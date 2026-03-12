package com.altern.submission;

import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
import com.altern.submission.service.SubmissionAsyncProcessor;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "altern.judge.async.enabled=true",
        "altern.judge.async.pool-size=1"
})
@AutoConfigureMockMvc
@Transactional
class SubmissionAsyncModeIntegrationTest {

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

    @MockBean
    private SubmissionAsyncProcessor submissionAsyncProcessor;

    @Test
    void createSubmissionReturnsPendingAndQueuesJudgeWhenAsyncModeEnabled() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Async Queue"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        var result = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "JAVA",
                                  "sourceCode": "public class Solution { public static int solve(int n) { return 23; } }"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.judgedAt").value(Matchers.nullValue()))
                .andExpect(jsonPath("$.passedTestCount").value(Matchers.nullValue()))
                .andExpect(jsonPath("$.executionTime").value(Matchers.nullValue()))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        long submissionId = body.get("id").asLong();

        ArgumentCaptor<Long> submissionIdCaptor = ArgumentCaptor.forClass(Long.class);
        verify(submissionAsyncProcessor).processSubmission(submissionIdCaptor.capture());
        assertEquals(submissionId, submissionIdCaptor.getValue());

        Submission savedSubmission = submissionRepository.findById(submissionId).orElseThrow();
        assertNotNull(savedSubmission.getCreatedAt());
        assertEquals(SubmissionStatus.PENDING, savedSubmission.getStatus());

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.judgeMode").value("ASYNC"))
                .andExpect(jsonPath("$.judgeQueue.pendingSubmissions").value(1))
                .andExpect(jsonPath("$.judgeQueue.pressure").value("ACTIVE"))
                .andExpect(jsonPath("$.judgeQueue.oldestPendingSubmissionId").value(submissionId))
                .andExpect(jsonPath("$.judgeQueue.oldestPendingCreatedAt").isNotEmpty())
                .andExpect(jsonPath("$.judgeQueue.oldestPendingAgeSeconds").isNumber());
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
}
