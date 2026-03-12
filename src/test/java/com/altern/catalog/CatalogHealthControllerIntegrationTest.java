package com.altern.catalog;

import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.entity.ProblemExampleValue;
import com.altern.problem.repository.ProblemRepository;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CatalogHealthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private TestCaseRepository testCaseRepository;

    @Test
    void catalogHealthEndpointRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/catalog/health"))
                .andExpect(status().isUnauthorized());

        String demoToken = login("demo", "demo123");

        mockMvc.perform(get("/api/admin/catalog/health")
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void catalogHealthEndpointReturnsCoverageAndFlagsWeakProblems() throws Exception {
        Problem weakProblem = new Problem();
        weakProblem.setTitle("Catalog Weak Spot");
        weakProblem.setDescription("Needs more authoring depth.");
        weakProblem.setDifficulty(Difficulty.MEDIUM);
        weakProblem.setExamples(new ArrayList<>(List.of(example("5", "12"))));
        weakProblem = problemRepository.save(weakProblem);
        long weakProblemId = weakProblem.getId();

        testCaseRepository.save(testCase(weakProblem, "5", "12", false));

        String adminToken = login("admin", "admin123");

        String responseBody = mockMvc.perform(get("/api/admin/catalog/health")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProblems").value((int) problemRepository.count()))
                .andExpect(jsonPath("$.totalTestCases").value((int) testCaseRepository.count()))
                .andExpect(jsonPath("$.problemsNeedingAttention").isNumber())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode response = objectMapper.readTree(responseBody);
        JsonNode attentionProblem = StreamSupport.stream(response.withArray("attentionProblems").spliterator(), false)
                .filter(node -> node.path("problemId").asLong() == weakProblemId)
                .findFirst()
                .orElse(null);

        assertNotNull(attentionProblem);
        assertEquals("Catalog Weak Spot", attentionProblem.path("title").asText());
        assertEquals("MEDIUM", attentionProblem.path("difficulty").asText());
        assertEquals(1, attentionProblem.path("totalTestCases").asInt());
        assertEquals(1, attentionProblem.path("publicTestCases").asInt());
        assertEquals(0, attentionProblem.path("hiddenTestCases").asInt());
        assertEquals(1, attentionProblem.path("exampleCount").asInt());
        assertTrue(attentionProblem.path("hintMissing").asBoolean());
        assertTrue(attentionProblem.path("editorialMissing").asBoolean());

        List<String> flags = StreamSupport.stream(attentionProblem.withArray("attentionFlags").spliterator(), false)
                .map(JsonNode::asText)
                .toList();

        assertTrue(flags.contains("NEEDS_HIDDEN_DEPTH"));
        assertTrue(flags.contains("LOW_TOTAL_CASE_COVERAGE"));
        assertTrue(flags.contains("LOW_EXAMPLE_DEPTH"));
        assertTrue(flags.contains("MISSING_HINT"));
        assertTrue(flags.contains("MISSING_EDITORIAL"));
    }

    private ProblemExampleValue example(String input, String output) {
        ProblemExampleValue example = new ProblemExampleValue();
        example.setInput(input);
        example.setOutput(output);
        example.setExplanation("Sample");
        return example;
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
                                .contentType(APPLICATION_JSON)
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
