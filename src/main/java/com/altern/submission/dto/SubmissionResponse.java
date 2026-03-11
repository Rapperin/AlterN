package com.altern.submission.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class SubmissionResponse {
    
    private Long id;
    private Long problemId;
    private String language;
    private String status;
    private LocalDateTime createdAt;
    private Integer passedTestCount;
    private Integer totalTestCount;
    private String problemTitle;
    
}