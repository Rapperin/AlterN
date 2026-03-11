package com.altern.submission.runner;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

@Component
public class CppProcessCodeRunner {

    private static final Duration DEFAULT_COMPILE_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration DEFAULT_RUN_TIMEOUT = Duration.ofSeconds(5);
    private static final int DEFAULT_MEMORY_USAGE_MB = 64;
    private final Duration compileTimeout;
    private final Duration runTimeout;

    public CppProcessCodeRunner() {
        this(DEFAULT_COMPILE_TIMEOUT, DEFAULT_RUN_TIMEOUT);
    }

    CppProcessCodeRunner(Duration compileTimeout, Duration runTimeout) {
        this.compileTimeout = compileTimeout;
        this.runTimeout = runTimeout;
    }

    public ExecutionResult run(ExecutionRequest request) {
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("altern-cpp-runner-");
            Files.writeString(tempDir.resolve("solution.cpp"), request.getSourceCode(), StandardCharsets.UTF_8);

            ProcessExecutionSupport.ProcessOutcome compileResult = ProcessExecutionSupport.execute(
                    tempDir,
                    compileTimeout,
                    null,
                    "g++",
                    "-std=c++20",
                    "-O2",
                    "solution.cpp",
                    "-o",
                    "solution"
            );
            if (compileResult.timedOut()) {
                return ExecutionResult.compilationError("Compilation timed out.");
            }
            if (compileResult.exitCode() != 0) {
                return ExecutionResult.compilationError(ProcessExecutionSupport.cleanMessage(compileResult.stderr()));
            }

            long startedAt = System.nanoTime();
            ProcessExecutionSupport.ProcessOutcome runResult = ProcessExecutionSupport.execute(
                    tempDir,
                    resolveRunTimeout(request),
                    request.getInput(),
                    "./solution"
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
