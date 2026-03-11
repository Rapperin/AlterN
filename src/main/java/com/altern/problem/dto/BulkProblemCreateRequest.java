package com.altern.problem.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkProblemCreateRequest {

    @NotEmpty
    private List<@Valid ProblemCreateRequest> problems;
}
