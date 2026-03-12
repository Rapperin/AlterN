package com.altern.submission.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class JudgeQueueHealthResponse {

    private int pendingSubmissions;
    private Long oldestPendingSubmissionId;
    private LocalDateTime oldestPendingCreatedAt;
    private Long oldestPendingAgeSeconds;
    private String pressure;
    private String message;
}
