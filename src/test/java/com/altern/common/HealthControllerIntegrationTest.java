package com.altern.common;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HealthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointReturnsRunnerStatus() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("AlterN"))
                .andExpect(jsonPath("$.profiles").isArray())
                .andExpect(jsonPath("$.profiles[0]").exists())
                .andExpect(jsonPath("$.judgeMode").value("SYNC"))
                .andExpect(jsonPath("$.judgeQueue.pendingSubmissions").value(0))
                .andExpect(jsonPath("$.judgeQueue.pressure").value("IDLE"))
                .andExpect(jsonPath("$.judgeQueue.message").value("Judge queue is empty."))
                .andExpect(jsonPath("$.runner.readiness").value("READY"))
                .andExpect(jsonPath("$.runner.requestedMode").value("LOCAL"))
                .andExpect(jsonPath("$.runner.mode").value("LOCAL"))
                .andExpect(jsonPath("$.runner.dockerEnabled").value(false))
                .andExpect(jsonPath("$.runner.dockerAvailable").value(false))
                .andExpect(jsonPath("$.runner.sandboxActive").value(false))
                .andExpect(jsonPath("$.runner.fallbackMode").value("LOCAL"))
                .andExpect(jsonPath("$.runner.supportedLanguageCount").value(3))
                .andExpect(jsonPath("$.runner.availableLanguageCount").value(3))
                .andExpect(jsonPath("$.runner.actionRequired").value(false))
                .andExpect(jsonPath("$.runner.checkedAt").exists())
                .andExpect(jsonPath("$.runner.localToolchains").isArray())
                .andExpect(jsonPath("$.runner.localToolchains[0].language").exists());
    }

    @Test
    void healthEndpointSupportsForcedRefresh() throws Exception {
        mockMvc.perform(get("/api/health").param("refresh", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.judgeMode").value("SYNC"))
                .andExpect(jsonPath("$.judgeQueue.pendingSubmissions").value(0))
                .andExpect(jsonPath("$.runner.checkedAt").exists());
    }
}
