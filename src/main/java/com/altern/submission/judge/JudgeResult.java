package com.altern.submission.judge;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class JudgeResult {
    
    private boolean accepted;
    private int passedTestCount;
    private int totalTestCount;
}