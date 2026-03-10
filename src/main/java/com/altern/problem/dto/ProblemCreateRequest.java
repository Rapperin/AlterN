package com.altern.problem.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class ProblemCreateRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String description;
    @NotBlank
    private String difficulty;
    
}