package com.altern.submission.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class ProblemWorkspaceResponse {

    private Long problemId;
    private int attemptCount;
    private int acceptedCount;
    private boolean solved;
    private Long lastSubmissionId;
    private String lastStatus;
    private String lastSubmissionLanguage;
    private LocalDateTime lastSubmittedAt;
    private String lastVerdictMessage;
    private Integer lastFailedTestIndex;
    private Boolean lastFailedVisible;
    private String lastFailedInputPreview;
    private String lastFailedExpectedOutputPreview;
    private String lastFailedActualOutputPreview;
    private Long lastAcceptedSubmissionId;
    private LocalDateTime lastAcceptedAt;
    private String lastAcceptedLanguage;
    private Integer lastAcceptedExecutionTime;
    private Integer lastAcceptedMemoryUsage;
    private Map<String, Integer> failureBreakdown;
}
