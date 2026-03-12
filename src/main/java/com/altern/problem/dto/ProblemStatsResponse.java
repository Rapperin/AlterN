package com.altern.problem.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class ProblemStatsResponse {

    private Long problemId;
    private String problemTitle;
    private Integer totalSubmissions;
    private Integer acceptedSubmissions;
    private Integer acceptedUsers;
    private Integer acceptanceRate;
    private String mostUsedLanguage;
    private Map<String, Integer> languageBreakdown;
    private Integer fastestExecutionTime;
    private Integer lowestMemoryUsage;
    private LocalDateTime latestAcceptedAt;
}
