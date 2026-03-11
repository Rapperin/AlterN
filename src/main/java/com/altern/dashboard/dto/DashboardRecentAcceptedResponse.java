package com.altern.dashboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DashboardRecentAcceptedResponse {

    private Long submissionId;
    private Long problemId;
    private String problemTitle;
    private String language;
    private LocalDateTime acceptedAt;
    private Integer executionTime;
    private Integer memoryUsage;
}
