package com.altern.problem.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProblemResponse {
    
    private Long id;
    private String title;
    private String description;
    private String difficulty;
    private int submissionCount;
    private int testCaseCount;
    private String bestSubmissionStatus;
    
    
}