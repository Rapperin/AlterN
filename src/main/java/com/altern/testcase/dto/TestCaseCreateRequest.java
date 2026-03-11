package com.altern.testcase.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class TestCaseCreateRequest {
    @NotBlank
    private String input;
    @NotBlank
    private String expectedOutput;
    private Boolean hidden;
    
}
