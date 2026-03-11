package com.altern.testcase.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestCaseResponse {
    
    private Long id;
    
    private String input;
    
    private String expectedOutput;
    
}