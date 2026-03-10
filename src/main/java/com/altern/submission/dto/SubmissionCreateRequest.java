package com.altern.submission.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionCreateRequest {
    
    @NotNull
    private Long problemId;
    
    @NotBlank
    private String language;
    
    @NotBlank
    private String sourceCode;
    
}