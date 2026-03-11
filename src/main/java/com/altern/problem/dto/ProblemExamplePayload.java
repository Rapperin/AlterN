package com.altern.problem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProblemExamplePayload {

    @NotBlank
    private String input;

    @NotBlank
    private String output;

    private String explanation;
}
