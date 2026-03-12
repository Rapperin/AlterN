package com.altern.dashboard.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DashboardJourneyFocusResponse {

    private Long problemId;
    private String problemTitle;
    private String difficulty;
    private String status;
    private String goalCode;
    private String goalTitle;
    private String reason;
    private String suggestedLanguage;
}
