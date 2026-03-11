package com.altern.submission.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionDetailResponse extends SubmissionResponse {

    private String sourceCode;
    private Integer failedTestIndex;
    private Boolean failedVisible;
    private String failedInputPreview;
    private String failedExpectedOutputPreview;
    private String failedActualOutputPreview;
}
