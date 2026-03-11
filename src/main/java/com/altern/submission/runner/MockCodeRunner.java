package com.altern.submission.runner;

import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class MockCodeRunner implements CodeRunner {

    @Override
    public ExecutionResult run(ExecutionRequest request) {
        int executionTime = ThreadLocalRandom.current().nextInt(10, 120);
        int memoryUsage = ThreadLocalRandom.current().nextInt(32, 256);
        String output = executeMock(request.getSourceCode(), request.getInput());

        return ExecutionResult.success(output, executionTime, memoryUsage, null);
    }

    private String executeMock(String sourceCode, String input) {
        if (!sourceCode.contains("class Solution")) {
            return "WRONG";
        }

        if ("10".equals(input)) {
            return "23";
        }

        if ("1000".equals(input)) {
            return "233168";
        }

        return "UNKNOWN";
    }
}
