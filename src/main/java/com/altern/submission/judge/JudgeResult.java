package com.altern.submission.judge;

import com.altern.submission.entity.SubmissionStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JudgeResult {
    
    private SubmissionStatus status;
    private int passedTestCount;
    private int totalTestCount;
    private Integer executionTime;
    private Integer memoryUsage;
    private String verdictMessage;
    private Integer failedTestIndex;
    private Boolean failedVisible;
    private String failedInputPreview;
    private String failedExpectedOutputPreview;
    private String failedActualOutputPreview;

    public boolean isAccepted() {
        return status == SubmissionStatus.ACCEPTED;
    }
}
