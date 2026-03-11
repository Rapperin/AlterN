package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JavaProcessCodeRunnerTest {

    private final JavaProcessCodeRunner codeRunner = new JavaProcessCodeRunner();

    @Test
    void compilesAndExecutesSolveMethod() {
        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.JAVA,
                """
                public class Solution {
                    public static int solve(int n) {
                        int total = 0;
                        for (int i = 0; i < n; i++) {
                            if (i % 3 == 0 || i % 5 == 0) {
                                total += i;
                            }
                        }
                        return total;
                    }
                }
                """,
                "10"
        ));

        assertEquals(ExecutionStatus.SUCCESS, result.getStatus());
        assertEquals("23", result.getOutput());
        assertNotNull(result.getExecutionTime());
        assertEquals(64, result.getMemoryUsage());
    }

    @Test
    void returnsCompilationErrorForInvalidJavaSource() {
        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.JAVA,
                "public class Solution { public static int solve(int n) { return ; } }",
                "10"
        ));

        assertEquals(ExecutionStatus.COMPILATION_ERROR, result.getStatus());
        assertTrue(result.getMessage().contains("error"));
    }

    @Test
    void returnsRuntimeErrorWhenUserCodeThrows() {
        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.JAVA,
                """
                public class Solution {
                    public static int solve(int n) {
                        throw new RuntimeException("boom");
                    }
                }
                """,
                "10"
        ));

        assertEquals(ExecutionStatus.RUNTIME_ERROR, result.getStatus());
        assertTrue(result.getMessage().contains("boom"));
    }

    @Test
    void returnsTimeLimitExceededWhenJavaExecutionTimesOut() {
        JavaProcessCodeRunner shortTimeoutRunner = new JavaProcessCodeRunner(Duration.ofSeconds(10), Duration.ofMillis(200));

        ExecutionResult result = shortTimeoutRunner.run(new ExecutionRequest(
                ProgrammingLanguage.JAVA,
                """
                public class Solution {
                    public static int solve(int n) {
                        while (true) {
                        }
                    }
                }
                """,
                "10"
        ));

        assertEquals(ExecutionStatus.TIME_LIMIT_EXCEEDED, result.getStatus());
        assertTrue(result.getExecutionTime() >= 1);
        assertEquals(64, result.getMemoryUsage());
        assertTrue(result.getMessage().contains("timed out"));
    }
}
