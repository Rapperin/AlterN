package com.altern.submission.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionAsyncProcessor {

    private final SubmissionJudgingService submissionJudgingService;

    @Async("judgeTaskExecutor")
    public void processSubmission(Long submissionId) {
        try {
            submissionJudgingService.evaluateSubmission(submissionId);
        } catch (Exception exception) {
            log.error("Async judge failed for submission {}", submissionId, exception);
            submissionJudgingService.markSubmissionAsInternalError(
                    submissionId,
                    "Judge worker failed before verdict. Try resubmitting."
            );
        }
    }
}
