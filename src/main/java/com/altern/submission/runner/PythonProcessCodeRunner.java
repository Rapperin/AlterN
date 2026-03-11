package com.altern.submission.runner;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

@Component
public class PythonProcessCodeRunner {

    private static final Duration DEFAULT_RUN_TIMEOUT = Duration.ofSeconds(5);
    private static final int DEFAULT_MEMORY_USAGE_MB = 64;
    private final Duration runTimeout;

    public PythonProcessCodeRunner() {
        this(DEFAULT_RUN_TIMEOUT);
    }

    PythonProcessCodeRunner(Duration runTimeout) {
        this.runTimeout = runTimeout;
    }

    public ExecutionResult run(ExecutionRequest request) {
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("altern-python-runner-");
            Files.writeString(tempDir.resolve("solution.py"), request.getSourceCode(), StandardCharsets.UTF_8);

            long startedAt = System.nanoTime();
            ProcessExecutionSupport.ProcessOutcome runResult = ProcessExecutionSupport.execute(
                    tempDir,
                    resolveRunTimeout(request),
                    request.getInput(),
                    "python3",
                    "solution.py"
            );
            int executionTime = ProcessExecutionSupport.elapsedMillis(startedAt);

            if (runResult.timedOut()) {
                return ExecutionResult.timeLimitExceeded("Execution timed out.", executionTime, DEFAULT_MEMORY_USAGE_MB);
            }
            if (runResult.exitCode() != 0) {
                return ExecutionResult.runtimeError(
                        ProcessExecutionSupport.cleanMessage(runResult.stderr()),
                        executionTime,
                        DEFAULT_MEMORY_USAGE_MB
                );
            }

            return ExecutionResult.success(runResult.stdout().trim(), executionTime, DEFAULT_MEMORY_USAGE_MB, null);
        } catch (IOException e) {
            return ExecutionResult.runtimeError("Runner IO error: " + e.getMessage(), 0, 0);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ExecutionResult.runtimeError("Runner interrupted.", 0, 0);
        } finally {
            ProcessExecutionSupport.deleteDirectoryQuietly(tempDir);
        }
    }

    private Duration resolveRunTimeout(ExecutionRequest request) {
        Integer customTimeLimitMs = request.getTimeLimitMs();
        if (customTimeLimitMs == null || customTimeLimitMs < 1) {
            return runTimeout;
        }

        return Duration.ofMillis(customTimeLimitMs);
    }
}
