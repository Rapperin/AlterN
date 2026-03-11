package com.altern.problem.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ProblemResponse {
    
    private Long id;
    private String title;
    private String description;
    private String constraints;
    private String inputFormat;
    private String outputFormat;
    private String hintTitle;
    private String hintContent;
    private String editorialTitle;
    private String editorialContent;
    private String difficulty;
    private Integer timeLimitMs;
    private List<String> tags;
    private List<ProblemExamplePayload> examples;
    private Map<String, String> starterCodes;
    private boolean hintAvailable;
    private boolean hintUnlocked;
    private boolean editorialAvailable;
    private boolean editorialUnlocked;
    private boolean viewerSolved;
    private String viewerStatus;
    private int submissionCount;
    private int testCaseCount;
    private String bestSubmissionStatus;
    
    
}
