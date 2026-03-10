package com.altern.submission.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Submission {
    
    private Long id;
    
    private Long problemId;
    
    private ProgrammingLanguage language;
    
    private String sourceCode;
    
    private SubmissionStatus status;
    
}