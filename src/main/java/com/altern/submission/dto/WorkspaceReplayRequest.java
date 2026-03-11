package com.altern.submission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkspaceReplayRequest {

    @NotBlank(message = "Language is required.")
    private String language;

    @NotBlank(message = "Source code is required.")
    private String sourceCode;

    private String input;
    private String expectedOutput;
}
