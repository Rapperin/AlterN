package com.altern.dashboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DashboardProblemActivityResponse {

    private Long submissionId;
    private Long problemId;
    private String problemTitle;
    private String difficulty;
    private String status;
    private String language;
    private LocalDateTime lastActivityAt;
}
