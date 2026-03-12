package com.altern.profile.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserProfileRecentAcceptedResponse {

    private Long submissionId;
    private Long problemId;
    private String problemTitle;
    private String language;
    private LocalDateTime acceptedAt;
    private Integer executionTime;
    private Integer memoryUsage;
}
