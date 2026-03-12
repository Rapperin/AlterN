package com.altern.catalog.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class CatalogHealthResponse {

    private Integer totalProblems;
    private Integer healthyProblems;
    private Integer problemsNeedingAttention;
    private Integer totalTestCases;
    private Integer publicTestCases;
    private Integer hiddenTestCases;
    private Map<String, Integer> problemsByDifficulty;
    private List<CatalogHealthProblemResponse> attentionProblems;
}
