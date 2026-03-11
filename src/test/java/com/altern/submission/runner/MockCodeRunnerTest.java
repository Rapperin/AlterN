package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MockCodeRunnerTest {

    private final MockCodeRunner codeRunner = new MockCodeRunner();

    @Test
    void returnsKnownOutputForSupportedInput() {
        ExecutionResult result = codeRunner.run(
                new ExecutionRequest(ProgrammingLanguage.JAVA, "public class Solution {}", "10")
        );

        assertEquals(ExecutionStatus.SUCCESS, result.getStatus());
        assertEquals("23", result.getOutput());
        assertNotNull(result.getExecutionTime());
        assertNotNull(result.getMemoryUsage());
    }

    @Test
    void returnsWrongOutputWhenSolutionClassIsMissing() {
        ExecutionResult result = codeRunner.run(
                new ExecutionRequest(ProgrammingLanguage.JAVA, "public class App {}", "10")
        );

        assertEquals(ExecutionStatus.SUCCESS, result.getStatus());
        assertEquals("WRONG", result.getOutput());
        assertTrue(result.getExecutionTime() >= 10);
        assertTrue(result.getMemoryUsage() >= 32);
    }
}
