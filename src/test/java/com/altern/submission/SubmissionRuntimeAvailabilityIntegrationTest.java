package com.altern.submission;

import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.repository.SubmissionRepository;
import com.altern.submission.runner.RunnerHealthService;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SubmissionRuntimeAvailabilityIntegrationTest {

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

    @MockitoBean
    private RunnerHealthService runnerHealthService;

    @Test
    void createSubmissionReturnsServiceUnavailableWhenRuntimeIsMissing() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Unavailable Runtime Submission"));
        testCaseRepository.save(testCase(problem, "10", "23", false));

        given(runnerHealthService.isLanguageExecutionAvailable(ProgrammingLanguage.PYTHON)).willReturn(false);
        given(runnerHealthService.buildLanguageUnavailableMessage(ProgrammingLanguage.PYTHON))
                .willReturn("PYTHON execution is unavailable right now. python3 unavailable for local execution.");

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "problemId": %d,
                                  "language": "PYTHON",
                                  "sourceCode": "print(23)"
                                }
                                """.formatted(problem.getId())))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("PYTHON execution is unavailable right now. python3 unavailable for local execution."));

        org.junit.jupiter.api.Assertions.assertEquals(0, submissionRepository.count());
    }

    @Test
    void replayReturnsServiceUnavailableWhenRuntimeIsMissing() throws Exception {
        String userToken = login("demo", "demo123");
        Problem problem = problemRepository.save(problem("Unavailable Runtime Replay"));

        given(runnerHealthService.isLanguageExecutionAvailable(ProgrammingLanguage.CPP)).willReturn(false);
        given(runnerHealthService.buildLanguageUnavailableMessage(ProgrammingLanguage.CPP))
                .willReturn("CPP execution is unavailable right now. g++ unavailable for local execution.");

        mockMvc.perform(post("/api/workspace/problems/{problemId}/replay", problem.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "language": "CPP",
                                  "sourceCode": "#include <iostream>\\nint main(){ std::cout << 23; }",
                                  "input": "10"
                                }
                                """))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("CPP execution is unavailable right now. g++ unavailable for local execution."));
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
