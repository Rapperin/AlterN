package com.altern.catalog.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CatalogHealthProblemResponse {

    private Long problemId;
    private String title;
    private String difficulty;
    private Integer totalTestCases;
    private Integer publicTestCases;
    private Integer hiddenTestCases;
    private Integer exampleCount;
    private boolean hintMissing;
    private boolean editorialMissing;
    private List<String> attentionFlags;
}
