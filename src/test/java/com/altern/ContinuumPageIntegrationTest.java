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
class ContinuumPageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void continuumServesTheCommunityAndJourneySurface() throws Exception {
        mockMvc.perform(get("/continuum.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Continuum")))
                .andExpect(content().string(containsString("Journey Map")))
                .andExpect(content().string(containsString("Personal Continuum")))
                .andExpect(content().string(containsString("Hall of Fame")))
                .andExpect(content().string(containsString("Public Solver Card")))
                .andExpect(content().string(containsString("Sanctum")))
                .andExpect(content().string(containsString("Session")));
    }
}
