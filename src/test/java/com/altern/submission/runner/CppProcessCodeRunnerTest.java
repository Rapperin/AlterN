package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CppProcessCodeRunnerTest {

    private final CppProcessCodeRunner codeRunner = new CppProcessCodeRunner();

    @Test
    void compilesAndExecutesCppProgram() {
        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.CPP,
                """
                #include <iostream>
                using namespace std;

                int main() {
                    long long n;
                    cin >> n;
                    long long total = 0;
                    for (long long i = 0; i < n; i++) {
                        if (i % 3 == 0 || i % 5 == 0) {
                            total += i;
                        }
                    }
                    cout << total;
                    return 0;
                }
                """,
                "10"
        ));

        assertEquals(ExecutionStatus.SUCCESS, result.getStatus());
        assertEquals("23", result.getOutput());
        assertTrue(result.getExecutionTime() >= 1);
    }

    @Test
    void returnsCompilationErrorForBrokenCppProgram() {
        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.CPP,
                "#include <iostream>\nint main( { return 0; }",
                "10"
        ));

        assertEquals(ExecutionStatus.COMPILATION_ERROR, result.getStatus());
        assertTrue(result.getMessage().contains("error"));
    }

    @Test
    void returnsTimeLimitExceededForInfiniteCppProgram() {
        CppProcessCodeRunner shortTimeoutRunner = new CppProcessCodeRunner(Duration.ofSeconds(10), Duration.ofMillis(200));

        ExecutionResult result = shortTimeoutRunner.run(new ExecutionRequest(
                ProgrammingLanguage.CPP,
                """
                int main() {
                    while (true) {
                    }
                    return 0;
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
