package com.altern.submission.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkspaceCompareRequest extends WorkspaceReplayRequest {

    @NotNull(message = "baselineSubmissionId is required")
    private Long baselineSubmissionId;
}
