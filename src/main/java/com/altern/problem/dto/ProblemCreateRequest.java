package com.altern.problem.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import com.altern.testcase.dto.TestCaseCreateRequest;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ProblemCreateRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String description;
    private String constraints;
    private String inputFormat;
    private String outputFormat;
    private String hintTitle;
    private String hintContent;
    private String editorialTitle;
    private String editorialContent;
    @NotBlank
    private String difficulty;

    @Positive
    private Integer timeLimitMs;

    @Positive
    private Integer memoryLimitMb;

    private List<@NotBlank String> tags;

    private List<@Valid ProblemExamplePayload> examples;

    private Map<String, String> starterCodes;

    private List<@Valid TestCaseCreateRequest> testCases;
}
