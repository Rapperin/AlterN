package com.altern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ArenaPageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void arenaServesTheSolveWorkbench() throws Exception {
        mockMvc.perform(get("/arena.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Solve Chamber")))
                .andExpect(content().string(containsString("Problem focus")))
                .andExpect(content().string(containsString("Execution Runtime")))
                .andExpect(content().string(containsString("Journey moved out")))
                .andExpect(content().string(containsString("Continuum")))
                .andExpect(content().string(containsString("Sanctum")))
                .andExpect(content().string(containsString("Custom Replay")))
                .andExpect(content().string(containsString("Submission Baseline")))
                .andExpect(content().string(containsString("Problem Leaderboard")));
    }
}
