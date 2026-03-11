package com.altern.submission.judge;

import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.testcase.entity.TestCase;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.runner.CodeRunner;
import com.altern.submission.runner.ExecutionRequest;
import com.altern.submission.runner.ExecutionResult;
import com.altern.submission.runner.ExecutionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JudgeService {

    private static final int PREVIEW_MAX_LENGTH = 500;

    private final CodeRunner codeRunner;

    public JudgeResult judge(List<TestCase> testCases, ProgrammingLanguage language, String sourceCode) {
        return judge(testCases, language, sourceCode, null);
    }

    public JudgeResult judge(List<TestCase> testCases, ProgrammingLanguage language, String sourceCode, Integer timeLimitMs) {
        if (!hasTestCases(testCases)) {
            return baseResult(SubmissionStatus.WRONG_ANSWER, 0, 0)
                    .executionTime(0)
                    .memoryUsage(0)
                    .verdictMessage("No test cases found.")
                    .build();
        }

        if (!hasSourceCode(sourceCode)) {
            return baseResult(SubmissionStatus.WRONG_ANSWER, 0, testCases.size())
                    .executionTime(0)
                    .memoryUsage(0)
                    .verdictMessage("Source code is empty.")
                    .build();
        }

        int passed = 0;
        int total = testCases.size();
        int totalExecutionTime = 0;
        int peakMemoryUsage = 0;

        for (int index = 0; index < testCases.size(); index++) {
            TestCase testCase = testCases.get(index);
            ExecutionResult executionResult = codeRunner.run(
                    new ExecutionRequest(language, sourceCode, testCase.getInput(), timeLimitMs)
            );

            if (executionResult.getStatus() == ExecutionStatus.COMPILATION_ERROR) {
                return baseResult(SubmissionStatus.COMPILATION_ERROR, passed, total)
                        .executionTime(metricOrZero(executionResult.getExecutionTime()))
                        .memoryUsage(metricOrZero(executionResult.getMemoryUsage()))
                        .verdictMessage(executionResult.getMessage())
                        .build();
            }

            if (executionResult.getStatus() == ExecutionStatus.TIME_LIMIT_EXCEEDED) {
                return executionFailureResult(
                        SubmissionStatus.TIME_LIMIT_EXCEEDED,
                        passed,
                        total,
                        metricOrZero(executionResult.getExecutionTime()),
                        metricOrZero(executionResult.getMemoryUsage()),
                        messageOrDefault(executionResult.getMessage(), testCase, "Execution timed out."),
                        testCase,
                        index + 1,
                        null
                );
            }

            if (executionResult.getStatus() == ExecutionStatus.RUNTIME_ERROR) {
                return executionFailureResult(
                        SubmissionStatus.RUNTIME_ERROR,
                        passed,
                        total,
                        metricOrZero(executionResult.getExecutionTime()),
                        metricOrZero(executionResult.getMemoryUsage()),
                        messageOrDefault(executionResult.getMessage(), testCase, "Runtime error."),
                        testCase,
                        index + 1,
                        null
                );
            }

            totalExecutionTime += metricOrZero(executionResult.getExecutionTime());
            peakMemoryUsage = Math.max(peakMemoryUsage, metricOrZero(executionResult.getMemoryUsage()));

            if (matchesExpectedOutput(executionResult.getOutput(), testCase.getExpectedOutput())) {
                passed++;
            } else {
                return executionFailureResult(
                        SubmissionStatus.WRONG_ANSWER,
                        passed,
                        total,
                        totalExecutionTime,
                        peakMemoryUsage,
                        messageOrDefault(executionResult.getMessage(), testCase, "Wrong answer."),
                        testCase,
                        index + 1,
                        executionResult.getOutput()
                );
            }
        }

        return baseResult(SubmissionStatus.ACCEPTED, passed, total)
                .executionTime(totalExecutionTime)
                .memoryUsage(peakMemoryUsage)
                .build();
    }

    private boolean hasTestCases(List<TestCase> testCases) {
        return testCases != null && !testCases.isEmpty();
    }

    private boolean hasSourceCode(String sourceCode) {
        return sourceCode != null && !sourceCode.isBlank();
    }

    private boolean matchesExpectedOutput(String actualOutput, String expectedOutput) {
        if (actualOutput == null || expectedOutput == null) {
            return false;
        }

        return actualOutput.trim().equals(expectedOutput.trim());
    }

    private int metricOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private JudgeResult.JudgeResultBuilder baseResult(SubmissionStatus status, int passed, int total) {
        return JudgeResult.builder()
                .status(status)
                .passedTestCount(passed)
                .totalTestCount(total);
    }

    private JudgeResult executionFailureResult(
            SubmissionStatus status,
            int passed,
            int total,
            int executionTime,
            int memoryUsage,
            String verdictMessage,
            TestCase testCase,
            int failedTestIndex,
            String actualOutput
    ) {
        JudgeResult.JudgeResultBuilder builder = baseResult(status, passed, total)
                .executionTime(executionTime)
                .memoryUsage(memoryUsage)
                .verdictMessage(verdictMessage)
                .failedTestIndex(failedTestIndex);

        if (isVisibleTestCase(testCase)) {
            builder.failedVisible(true)
                    .failedInputPreview(preview(testCase.getInput()))
                    .failedExpectedOutputPreview(preview(testCase.getExpectedOutput()))
                    .failedActualOutputPreview(preview(actualOutput));
        } else {
            builder.failedVisible(false);
        }

        return builder.build();
    }

    private boolean isVisibleTestCase(TestCase testCase) {
        return testCase != null && !Boolean.TRUE.equals(testCase.getHidden());
    }

    private String messageOrDefault(String message, TestCase testCase, String baseMessage) {
        if (message != null && !message.isBlank()) {
            return message;
        }

        return isVisibleTestCase(testCase)
                ? baseMessage + " Visible test case failed."
                : baseMessage + " Hidden test case failed.";
    }

    private String preview(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        if (value.length() <= PREVIEW_MAX_LENGTH) {
            return value;
        }

        return value.substring(0, PREVIEW_MAX_LENGTH - 3) + "...";
    }
}
