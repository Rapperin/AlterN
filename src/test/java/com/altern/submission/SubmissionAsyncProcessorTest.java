package com.altern.submission;

import com.altern.submission.service.SubmissionAsyncProcessor;
import com.altern.submission.service.SubmissionJudgingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SubmissionAsyncProcessorTest {

    @Mock
    private SubmissionJudgingService submissionJudgingService;

    @InjectMocks
    private SubmissionAsyncProcessor submissionAsyncProcessor;

    @Test
    void processSubmissionMarksInternalErrorWhenJudgeWorkerFails() {
        doThrow(new RuntimeException("boom"))
                .when(submissionJudgingService)
                .evaluateSubmission(42L);

        submissionAsyncProcessor.processSubmission(42L);

        verify(submissionJudgingService).evaluateSubmission(42L);
        verify(submissionJudgingService).markSubmissionAsInternalError(
                42L,
                "Judge worker failed before verdict. Try resubmitting."
        );
    }
}
