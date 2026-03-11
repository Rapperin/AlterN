package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import lombok.Getter;

@Getter
public class ExecutionRequest {

    private final ProgrammingLanguage language;
    private final String sourceCode;
    private final String input;
    private final Integer timeLimitMs;

    public ExecutionRequest(ProgrammingLanguage language, String sourceCode, String input) {
        this(language, sourceCode, input, null);
    }

    public ExecutionRequest(ProgrammingLanguage language, String sourceCode, String input, Integer timeLimitMs) {
        this.language = language;
        this.sourceCode = sourceCode;
        this.input = input;
        this.timeLimitMs = timeLimitMs;
    }
}
