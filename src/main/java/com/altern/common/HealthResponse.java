package com.altern.common;

import com.altern.submission.dto.JudgeQueueHealthResponse;
import com.altern.submission.runner.RunnerHealthResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class HealthResponse {

    private String status;
    private String application;
    private List<String> profiles;
    private String judgeMode;
    private JudgeQueueHealthResponse judgeQueue;
    private RunnerHealthResponse runner;
}
