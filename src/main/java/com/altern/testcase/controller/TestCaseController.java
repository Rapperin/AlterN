package com.altern.testcase.controller;

import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.dto.TestCaseResponse;
import com.altern.testcase.service.TestCaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/problems/{problemId}/testcases")
@Tag(name = "Test Cases", description = "Test case management APIs")
public class TestCaseController {
    
    private final TestCaseService testCaseService;
    
    @Operation(
            summary = "Get test cases of a problem",
            description = "Returns all test cases for the given problem id"
    )
    @GetMapping
    public List<TestCaseResponse> getTestCasesByProblemId(@PathVariable Long problemId) {
        return testCaseService.getTestCasesByProblemId(problemId);
    }
    @Operation(
            summary = "Create test case",
            description = "Creates a new test case for the given problem id"
    )
    @PostMapping
    public TestCaseResponse createTestCase(
            @Parameter(description = "Problem id")
            @PathVariable Long problemId,
            @Valid @RequestBody TestCaseCreateRequest request
    ) {
        return testCaseService.createTestCase(problemId, request);
    }
}