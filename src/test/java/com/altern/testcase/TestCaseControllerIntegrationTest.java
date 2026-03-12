package com.altern.testcase;

import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TestCaseControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private TestCaseRepository testCaseRepository;

    @Test
    void createTestCaseDefaultsHiddenToFalseWhenOmitted() throws Exception {
        Problem problem = problemRepository.save(problem("Two Sum"));
        String adminToken = login("admin", "admin123");
        TestCaseCreateRequest request = new TestCaseCreateRequest();
        request.setInput("10");
        request.setExpectedOutput("23");

        mockMvc.perform(post("/api/problems/{problemId}/testcases", problem.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hidden").value(false));
    }

    @Test
    void regularUserCannotCreateTestCase() throws Exception {
        Problem problem = problemRepository.save(problem("Protected Samples"));
        String userToken = login("demo", "demo123");
        TestCaseCreateRequest request = new TestCaseCreateRequest();
        request.setInput("10");
        request.setExpectedOutput("23");

        mockMvc.perform(post("/api/problems/{problemId}/testcases", problem.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void publicProblemTestCaseListingReturnsOnlyVisibleCases() throws Exception {
        Problem problem = problemRepository.save(problem("Hidden Samples"));
        testCaseRepository.save(testCase(problem, "10", "23", false));
        testCaseRepository.save(testCase(problem, "1000", "233168", true));

        mockMvc.perform(get("/api/problems/{problemId}/testcases", problem.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].input").value("10"))
                .andExpect(jsonPath("$[0].expectedOutput").value("23"))
                .andExpect(jsonPath("$[0].hidden").value(false));
    }

    @Test
    void adminListingReturnsHiddenAndVisibleTestCases() throws Exception {
        Problem problem = problemRepository.save(problem("Admin Samples"));
        String adminToken = login("admin", "admin123");
        testCaseRepository.save(testCase(problem, "10", "23", false));
        testCaseRepository.save(testCase(problem, "1000", "233168", true));

        mockMvc.perform(get("/api/problems/{problemId}/testcases/admin", problem.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void publicCannotAccessAdminTestCaseListing() throws Exception {
        Problem problem = problemRepository.save(problem("Admin Gate"));

        mockMvc.perform(get("/api/problems/{problemId}/testcases/admin", problem.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void problemResponseCountsOnlyVisibleTestCases() throws Exception {
        Problem problem = problemRepository.save(problem("Visible Count"));
        testCaseRepository.save(testCase(problem, "10", "23", false));
        testCaseRepository.save(testCase(problem, "1000", "233168", true));

        mockMvc.perform(get("/api/problems/{id}", problem.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.testCaseCount").value(1))
                .andExpect(jsonPath("$.timeLimitMs").value(5000))
                .andExpect(jsonPath("$.memoryLimitMb").value(256));
    }

    @Test
    void adminCanBulkCreateTestCases() throws Exception {
        Problem problem = problemRepository.save(problem("Bulk Cases"));
        String adminToken = login("admin", "admin123");

        mockMvc.perform(post("/api/problems/{problemId}/testcases/bulk", problem.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "testCases": [
                                    {
                                      "input": "1",
                                      "expectedOutput": "1",
                                      "hidden": false
                                    },
                                    {
                                      "input": "2",
                                      "expectedOutput": "4",
                                      "hidden": true
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[1].hidden").value(true));
    }

    @Test
    void adminCanUpdateTestCase() throws Exception {
        Problem problem = problemRepository.save(problem("Editable Case"));
        String adminToken = login("admin", "admin123");
        TestCase testCase = testCaseRepository.save(testCase(problem, "10", "23", false));

        mockMvc.perform(put("/api/problems/{problemId}/testcases/{testCaseId}", problem.getId(), testCase.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "input": "12",
                                  "expectedOutput": "34",
                                  "hidden": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.input").value("12"))
                .andExpect(jsonPath("$.expectedOutput").value("34"))
                .andExpect(jsonPath("$.hidden").value(true));
    }

    @Test
    void adminCanDeleteTestCase() throws Exception {
        Problem problem = problemRepository.save(problem("Delete Case"));
        String adminToken = login("admin", "admin123");
        TestCase testCase = testCaseRepository.save(testCase(problem, "10", "23", false));

        mockMvc.perform(delete("/api/problems/{problemId}/testcases/{testCaseId}", problem.getId(), testCase.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertFalse(testCaseRepository.existsById(testCase.getId()));
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
        return objectMapper.readTree(
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
        ).get("token").asText();
    }
}
