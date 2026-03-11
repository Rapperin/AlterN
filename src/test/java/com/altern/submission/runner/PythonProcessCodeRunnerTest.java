package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PythonProcessCodeRunnerTest {

    private final PythonProcessCodeRunner codeRunner = new PythonProcessCodeRunner();

    @Test
    void executesPythonScriptAgainstStandardInput() {
        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.PYTHON,
                """
                n = int(input().strip())
                total = sum(i for i in range(n) if i % 3 == 0 or i % 5 == 0)
                print(total)
                """,
                "10"
        ));

        assertEquals(ExecutionStatus.SUCCESS, result.getStatus());
        assertEquals("23", result.getOutput());
        assertTrue(result.getExecutionTime() >= 1);
    }

    @Test
    void returnsRuntimeErrorForBrokenPythonScript() {
        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.PYTHON,
                "raise RuntimeError('boom')",
                "10"
        ));

        assertEquals(ExecutionStatus.RUNTIME_ERROR, result.getStatus());
        assertTrue(result.getMessage().contains("boom"));
    }

    @Test
    void returnsTimeLimitExceededForInfinitePythonScript() {
        PythonProcessCodeRunner shortTimeoutRunner = new PythonProcessCodeRunner(Duration.ofMillis(200));

        ExecutionResult result = shortTimeoutRunner.run(new ExecutionRequest(
                ProgrammingLanguage.PYTHON,
                """
                while True:
                    pass
                """,
                "10"
        ));

        assertEquals(ExecutionStatus.TIME_LIMIT_EXCEEDED, result.getStatus());
        assertTrue(result.getExecutionTime() >= 1);
        assertEquals(64, result.getMemoryUsage());
        assertTrue(result.getMessage().contains("timed out"));
    }
}
