package com.altern.submission.runner;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExecutionResult {

    private ExecutionStatus status;
    private String output;
    private Integer executionTime;
    private Integer memoryUsage;
    private String message;

    public static ExecutionResult success(String output, Integer executionTime, Integer memoryUsage, String message) {
        return new ExecutionResult(ExecutionStatus.SUCCESS, output, executionTime, memoryUsage, message);
    }

    public static ExecutionResult compilationError(String message) {
        return new ExecutionResult(ExecutionStatus.COMPILATION_ERROR, null, 0, 0, message);
    }

    public static ExecutionResult timeLimitExceeded(String message, Integer executionTime, Integer memoryUsage) {
        return new ExecutionResult(ExecutionStatus.TIME_LIMIT_EXCEEDED, null, executionTime, memoryUsage, message);
    }

    public static ExecutionResult runtimeError(String message, Integer executionTime, Integer memoryUsage) {
        return new ExecutionResult(ExecutionStatus.RUNTIME_ERROR, null, executionTime, memoryUsage, message);
    }
}
