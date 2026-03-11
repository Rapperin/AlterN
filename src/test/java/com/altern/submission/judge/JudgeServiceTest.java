package com.altern.submission.judge;

import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.runner.CodeRunner;
import com.altern.submission.runner.ExecutionResult;
import com.altern.submission.runner.MockCodeRunner;
import com.altern.testcase.entity.TestCase;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JudgeServiceTest {

    private final JudgeService judgeService = new JudgeService(new MockCodeRunner());

    @Test
    void returnsWrongAnswerWhenNoTestCasesExist() {
        JudgeResult result = judgeService.judge(List.of(), null, "public class Solution {}");

        assertEquals(SubmissionStatus.WRONG_ANSWER, result.getStatus());
        assertEquals(0, result.getPassedTestCount());
        assertEquals(0, result.getTotalTestCount());
        assertEquals(0, result.getExecutionTime());
        assertEquals(0, result.getMemoryUsage());
        assertEquals("No test cases found.", result.getVerdictMessage());
    }

    @Test
    void returnsWrongAnswerWhenSourceCodeIsBlank() {
        JudgeResult result = judgeService.judge(List.of(testCase("10", "23")), null, "   ");

        assertEquals(SubmissionStatus.WRONG_ANSWER, result.getStatus());
        assertEquals(0, result.getPassedTestCount());
        assertEquals(1, result.getTotalTestCount());
        assertEquals(0, result.getExecutionTime());
        assertEquals(0, result.getMemoryUsage());
        assertEquals("Source code is empty.", result.getVerdictMessage());
    }

    @Test
    void returnsPartialPassWithMetricsWhenSomeTestsFail() {
        JudgeResult result = judgeService.judge(
                List.of(testCase("10", "23"), testCase("42", "42")),
                null,
                "public class Solution {}"
        );

        assertEquals(SubmissionStatus.WRONG_ANSWER, result.getStatus());
        assertEquals(1, result.getPassedTestCount());
        assertEquals(2, result.getTotalTestCount());
        assertNotNull(result.getExecutionTime());
        assertNotNull(result.getMemoryUsage());
        assertTrue(result.getExecutionTime() >= 10);
        assertTrue(result.getMemoryUsage() >= 32);
        assertEquals("Wrong answer. Visible test case failed.", result.getVerdictMessage());
        assertEquals(2, result.getFailedTestIndex());
        assertEquals(Boolean.TRUE, result.getFailedVisible());
        assertEquals("42", result.getFailedInputPreview());
        assertEquals("42", result.getFailedExpectedOutputPreview());
        assertEquals("UNKNOWN", result.getFailedActualOutputPreview());
    }

    @Test
    void returnsAcceptedWithMetricsWhenAllTestsPass() {
        JudgeResult result = judgeService.judge(
                List.of(testCase("10", "23"), testCase("1000", "233168")),
                null,
                "public class Solution {}"
        );

        assertEquals(SubmissionStatus.ACCEPTED, result.getStatus());
        assertTrue(result.isAccepted());
        assertEquals(2, result.getPassedTestCount());
        assertEquals(2, result.getTotalTestCount());
        assertNotNull(result.getExecutionTime());
        assertNotNull(result.getMemoryUsage());
        assertTrue(result.getExecutionTime() >= 10);
        assertTrue(result.getMemoryUsage() >= 32);
        assertNull(result.getVerdictMessage());
        assertNull(result.getFailedTestIndex());
        assertNull(result.getFailedVisible());
    }

    @Test
    void returnsTimeLimitExceededWhenRunnerTimesOut() {
        CodeRunner timeoutingRunner = request -> ExecutionResult.timeLimitExceeded("Execution timed out.", 201, 64);
        JudgeService judgeService = new JudgeService(timeoutingRunner);

        JudgeResult result = judgeService.judge(List.of(testCase("10", "23")), null, "public class Solution {}");

        assertEquals(SubmissionStatus.TIME_LIMIT_EXCEEDED, result.getStatus());
        assertEquals(0, result.getPassedTestCount());
        assertEquals(1, result.getTotalTestCount());
        assertEquals(201, result.getExecutionTime());
        assertEquals(64, result.getMemoryUsage());
        assertEquals("Execution timed out.", result.getVerdictMessage());
        assertEquals(1, result.getFailedTestIndex());
        assertEquals(Boolean.TRUE, result.getFailedVisible());
    }

    @Test
    void doesNotExposeHiddenFailurePreview() {
        TestCase visible = testCase("10", "23");
        TestCase hidden = testCase("42", "42");
        hidden.setHidden(true);

        JudgeResult result = judgeService.judge(
                List.of(visible, hidden),
                null,
                "public class Solution {}"
        );

        assertEquals(SubmissionStatus.WRONG_ANSWER, result.getStatus());
        assertEquals(1, result.getPassedTestCount());
        assertEquals(2, result.getFailedTestIndex());
        assertEquals(Boolean.FALSE, result.getFailedVisible());
        assertNull(result.getFailedInputPreview());
        assertNull(result.getFailedExpectedOutputPreview());
        assertNull(result.getFailedActualOutputPreview());
        assertEquals("Wrong answer. Hidden test case failed.", result.getVerdictMessage());
    }

    private TestCase testCase(String input, String expectedOutput) {
        TestCase testCase = new TestCase();
        testCase.setInput(input);
        testCase.setExpectedOutput(expectedOutput);
        return testCase;
    }
}
