package com.altern.submission.runner;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LanguageRuntimeHealthResponse {

    private String language;
    private String mode;
    private boolean available;
    private String command;
    private String message;
    private String version;
    private String setupSummary;
    private String setupCommand;
}
