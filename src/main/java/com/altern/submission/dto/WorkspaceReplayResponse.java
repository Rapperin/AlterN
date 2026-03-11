package com.altern.submission.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkspaceReplayResponse {

    private Long problemId;
    private String status;
    private String output;
    private String expectedOutput;
    private Boolean matchedExpected;
    private Integer executionTime;
    private Integer memoryUsage;
    private String message;
}
