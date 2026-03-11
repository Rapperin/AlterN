package com.altern.submission.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkspaceCompareResponse {

    private Long problemId;
    private String input;
    private String expectedOutput;
    private Boolean sameOutput;
    private WorkspaceCompareRunResponse currentRun;
    private WorkspaceCompareRunResponse baselineRun;
}
