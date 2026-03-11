package com.altern.submission.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkspaceCompareRunResponse {

    private Long submissionId;
    private String language;
    private String status;
    private String output;
    private Boolean matchedExpected;
    private Integer executionTime;
    private Integer memoryUsage;
    private String message;
}
