package com.altern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HomePageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rootServesTheLandingPage() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("index.html"));

        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("AlterN")))
                .andExpect(content().string(containsString("Kodunu Yaz")))
                .andExpect(content().string(containsString("Problem focus")))
                .andExpect(content().string(containsString("Your Dashboard")))
                .andExpect(content().string(containsString("Progress Snapshot")))
                .andExpect(content().string(containsString("Hall of Fame")))
                .andExpect(content().string(containsString("Custom Replay")))
                .andExpect(content().string(containsString("Submission Baseline")))
                .andExpect(content().string(containsString("Local Drafts")))
                .andExpect(content().string(containsString("Problem Leaderboard")))
                .andExpect(content().string(containsString("Hint")))
                .andExpect(content().string(containsString("Editorial")));
    }
}
