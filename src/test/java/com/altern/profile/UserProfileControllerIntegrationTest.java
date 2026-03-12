package com.altern.profile;

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
class UserProfileControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Test
    void publicProfileReturnsCommunityStatsAndRecentAccepted() throws Exception {
        UserAccount aliceUser = createUser("alice_profile");
        UserAccount bobUser = createUser("bob_profile");

        Problem easyProblem = problemRepository.save(problem("Profile Easy", Difficulty.EASY));
        Problem mediumProblem = problemRepository.save(problem("Profile Medium", Difficulty.MEDIUM));
        Problem hardProblem = problemRepository.save(problem("Profile Hard", Difficulty.HARD));

        submissionRepository.save(submission(
                aliceUser,
                easyProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.JAVA,
                11,
                24,
                LocalDateTime.now().minusDays(4)
        ));
        submissionRepository.save(submission(
                aliceUser,
                mediumProblem,
                SubmissionStatus.WRONG_ANSWER,
                ProgrammingLanguage.PYTHON,
                null,
                null,
                LocalDateTime.now().minusDays(3)
        ));
        submissionRepository.save(submission(
                aliceUser,
                mediumProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.PYTHON,
                9,
                20,
                LocalDateTime.now().minusDays(2)
        ));
        submissionRepository.save(submission(
                aliceUser,
                hardProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.CPP,
                7,
                18,
                LocalDateTime.now().minusDays(1)
        ));

        submissionRepository.save(submission(
                bobUser,
                easyProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.JAVA,
                19,
                32,
                LocalDateTime.now().minusHours(6)
        ));

        mockMvc.perform(get("/api/users/{username}/profile", "alice_profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice_profile"))
                .andExpect(jsonPath("$.viewer").value(false))
                .andExpect(jsonPath("$.globalRank").value(1))
                .andExpect(jsonPath("$.totalRankedUsers").value(2))
                .andExpect(jsonPath("$.solvedProblems").value(3))
                .andExpect(jsonPath("$.attemptedProblems").value(3))
                .andExpect(jsonPath("$.totalSubmissions").value(4))
                .andExpect(jsonPath("$.acceptedSubmissions").value(3))
                .andExpect(jsonPath("$.acceptanceRate").value(75))
                .andExpect(jsonPath("$.mostUsedLanguage").value("PYTHON"))
                .andExpect(jsonPath("$.activeDays").value(4))
                .andExpect(jsonPath("$.currentAcceptedStreakDays").value(2))
                .andExpect(jsonPath("$.longestAcceptedStreakDays").value(2))
                .andExpect(jsonPath("$.solvedByDifficulty.EASY").value(1))
                .andExpect(jsonPath("$.solvedByDifficulty.MEDIUM").value(1))
                .andExpect(jsonPath("$.solvedByDifficulty.HARD").value(1))
                .andExpect(jsonPath("$.achievements[*].code", Matchers.contains("FIRST_ACCEPTED", "HARD_SOLVER", "POLYGLOT", "COMEBACK")))
                .andExpect(jsonPath("$.journey.level").value(3))
                .andExpect(jsonPath("$.journey.title").value("Builder"))
                .andExpect(jsonPath("$.journey.solvedProblems").value(3))
                .andExpect(jsonPath("$.journey.nextLevel").value(4))
                .andExpect(jsonPath("$.journey.nextTitle").value("Solver"))
                .andExpect(jsonPath("$.journey.nextSolvedTarget").value(5))
                .andExpect(jsonPath("$.journey.progressPercent").value(0))
                .andExpect(jsonPath("$.journey.nextGoals[*].code", Matchers.contains("STREAK_3", "FIVE_SOLVED")))
                .andExpect(jsonPath("$.recentAccepted", Matchers.hasSize(3)))
                .andExpect(jsonPath("$.recentAccepted[0].problemTitle").value("Profile Hard"))
                .andExpect(jsonPath("$.recentAccepted[1].problemTitle").value("Profile Medium"))
                .andExpect(jsonPath("$.recentAccepted[2].problemTitle").value("Profile Easy"));
    }

    @Test
    void publicProfileMarksViewerAndDoesNotExposeAdminAccounts() throws Exception {
        String demoToken = login("demo", "demo123");
        UserAccount demoUser = userAccountRepository.findByUsername("demo").orElseThrow();
        Problem demoProblem = problemRepository.save(problem("Demo Profile Problem", Difficulty.EASY));
        submissionRepository.save(submission(
                demoUser,
                demoProblem,
                SubmissionStatus.ACCEPTED,
                ProgrammingLanguage.JAVA,
                12,
                16,
                LocalDateTime.now().minusHours(1)
        ));

        mockMvc.perform(get("/api/users/{username}/profile", "demo")
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo"))
                .andExpect(jsonPath("$.viewer").value(true))
                .andExpect(jsonPath("$.globalRank").value(1));

        mockMvc.perform(get("/api/users/{username}/profile", "admin"))
                .andExpect(status().isNotFound());
    }

    private UserAccount createUser(String username) {
        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setPasswordHash("test-hash");
        user.setRole(UserRole.USER);
        user.setCreatedAt(LocalDateTime.now().minusDays(10));
        return userAccountRepository.save(user);
    }

    private Problem problem(String title, Difficulty difficulty) {
        Problem problem = new Problem();
        problem.setTitle(title);
        problem.setDescription("Profile problem");
        problem.setDifficulty(difficulty);
        return problem;
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
