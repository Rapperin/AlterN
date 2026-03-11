package com.altern.testcase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkTestCaseCreateRequest {

    @NotEmpty
    private List<@Valid TestCaseCreateRequest> testCases;
}
