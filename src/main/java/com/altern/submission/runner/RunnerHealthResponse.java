package com.altern.submission.runner;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@AllArgsConstructor
public class RunnerHealthResponse {

    private String readiness;
    private String requestedMode;
    private String mode;
    private boolean dockerEnabled;
    private boolean dockerAvailable;
    private boolean sandboxActive;
    private String fallbackMode;
    private String message;
    private String dockerVersion;
    private int supportedLanguageCount;
    private int availableLanguageCount;
    private boolean actionRequired;
    private String actionMessage;
    private List<LanguageRuntimeHealthResponse> localToolchains;
    private Instant checkedAt;
}
