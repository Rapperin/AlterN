package com.altern.submission.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionResponse {
    
    private Long id;
    private Long problemId;
    private String language;
    private String status;
    
}