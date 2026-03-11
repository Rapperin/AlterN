package com.altern.leaderboard;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.entity.UserRole;
import com.altern.auth.repository.UserAccountRepository;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class LeaderboardControllerIntegrationTest {

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

    @Test
    void globalLeaderboardReturnsPublicRankingAndHighlightsViewer() throws Exception {
        String demoToken = login("demo", "demo123");
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        UserAccount adminUser = userAccountRepository.findByUsername("admin").orElseThrow();
        UserAccount aliceUser = createUser("alice_board");

        Problem firstProblem = problemRepository.save(problem("Leaderboard One", Difficulty.EASY));
        Problem secondProblem = problemRepository.save(problem("Leaderboard Two", Difficulty.MEDIUM));
        Problem sharedProblem = problemRepository.save(problem("Leaderboard Shared", Difficulty.HARD));

        submissionRepository.save(submission(demoUser, firstProblem, SubmissionStatus.ACCEPTED, ProgrammingLanguage.JAVA, 14, 32, LocalDateTime.now().minusHours(3)));
        submissionRepository.save(submission(demoUser, secondProblem, SubmissionStatus.ACCEPTED, ProgrammingLanguage.JAVA, 12, 28, LocalDateTime.now().minusHours(1)));
        submissionRepository.save(submission(demoUser, sharedProblem, SubmissionStatus.WRONG_ANSWER, ProgrammingLanguage.JAVA, null, null, LocalDateTime.now().minusMinutes(30)));

        submissionRepository.save(submission(aliceUser, sharedProblem, SubmissionStatus.ACCEPTED, ProgrammingLanguage.PYTHON, 20, 24, LocalDateTime.now().minusHours(2)));
        submissionRepository.save(submission(adminUser, sharedProblem, SubmissionStatus.ACCEPTED, ProgrammingLanguage.JAVA, 8, 16, LocalDateTime.now().minusMinutes(10)));

        mockMvc.perform(get("/api/leaderboard")
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRankedUsers").value(2))
                .andExpect(jsonPath("$.totalAcceptedSubmissions").value(3))
                .andExpect(jsonPath("$.entries", Matchers.hasSize(2)))
                .andExpect(jsonPath("$.entries[0].username").value("demo"))
                .andExpect(jsonPath("$.entries[0].solvedProblems").value(2))
                .andExpect(jsonPath("$.entries[0].acceptanceRate").value(67))
                .andExpect(jsonPath("$.entries[0].viewer").value(true))
                .andExpect(jsonPath("$.entries[0].recentAcceptedProblemTitle").value("Leaderboard Two"))
                .andExpect(jsonPath("$.entries[1].username").value("alice_board"))
                .andExpect(jsonPath("$.entries[1].solvedProblems").value(1))
                .andExpect(jsonPath("$.entries[1].viewer").value(false));
    }

    @Test
    void problemLeaderboardReturnsBestAcceptedRunPerUser() throws Exception {
        String demoToken = login("demo", "demo123");
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        UserAccount adminUser = userAccountRepository.findByUsername("admin").orElseThrow();
        UserAccount aliceUser = createUser("alice_problem");

        Problem rankedProblem = problemRepository.save(problem("Problem Leaderboard", Difficulty.MEDIUM));

        Submission demoFast = submissionRepository.save(submission(
                demoUser,
                rankedProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.JAVA,
                11,
                30,
                LocalDateTime.now().minusMinutes(40)
        ));
        submissionRepository.save(submission(
                demoUser,
                rankedProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.JAVA,
                23,
                18,
                LocalDateTime.now().minusMinutes(20)
        ));
        submissionRepository.save(submission(
                aliceUser,
                rankedProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.CPP,
                15,
                20,
                LocalDateTime.now().minusMinutes(30)
        ));
        submissionRepository.save(submission(
                adminUser,
                rankedProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.JAVA,
                9,
                10,
                LocalDateTime.now().minusMinutes(10)
        ));

        mockMvc.perform(get("/api/problems/{id}/leaderboard", rankedProblem.getId())
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problemTitle").value("Problem Leaderboard"))
                .andExpect(jsonPath("$.totalAcceptedUsers").value(2))
                .andExpect(jsonPath("$.totalAcceptedSubmissions").value(3))
                .andExpect(jsonPath("$.entries", Matchers.hasSize(2)))
                .andExpect(jsonPath("$.entries[0].submissionId").value(demoFast.getId()))
                .andExpect(jsonPath("$.entries[0].username").value("demo"))
                .andExpect(jsonPath("$.entries[0].viewer").value(true))
                .andExpect(jsonPath("$.entries[1].username").value("alice_problem"))
                .andExpect(jsonPath("$.entries[1].language").value("CPP"));
    }

    private Problem problem(String title, Difficulty difficulty) {
        Problem problem = new Problem();
        problem.setTitle(title);
        problem.setDescription("Leaderboard problem");
        problem.setDifficulty(difficulty);
        return problem;
    }

    private UserAccount createUser(String username) {
        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setPasswordHash("test-hash");
        user.setRole(UserRole.USER);
        user.setCreatedAt(LocalDateTime.now());
        return userAccountRepository.save(user);
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
        Submission submission = new Submission();
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setLanguage(language);
        submission.setSourceCode("code");
        submission.setStatus(status);
        submission.setCreatedAt(judgedAt.minusSeconds(5));
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
