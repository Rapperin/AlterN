package com.altern.testcase.controller;

import com.altern.testcase.dto.BulkTestCaseCreateRequest;
import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.dto.TestCaseResponse;
import com.altern.testcase.service.TestCaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
            description = "Returns only public (non-hidden) test cases for the given problem id"
    )
    @GetMapping
    public List<TestCaseResponse> getTestCasesByProblemId(@PathVariable Long problemId) {
        return testCaseService.getTestCasesByProblemId(problemId);
    }

    @Operation(
            summary = "Get all test cases of a problem",
            description = "Admin-only endpoint that returns both public and hidden test cases for the given problem id"
    )
    @GetMapping("/admin")
    public List<TestCaseResponse> getAllTestCasesByProblemId(@PathVariable Long problemId) {
        return testCaseService.getAllTestCasesByProblemId(problemId);
    }

    @Operation(
            summary = "Create test case",
            description = "Creates a new test case for the given problem id. Hidden test cases are still used by the judge."
    )
    @PostMapping
    public TestCaseResponse createTestCase(
            @Parameter(description = "Problem id")
            @PathVariable Long problemId,
            @Valid @RequestBody TestCaseCreateRequest request
    ) {
        return testCaseService.createTestCase(problemId, request);
    }

    @Operation(
            summary = "Bulk create test cases",
            description = "Creates multiple test cases for the given problem id in one request"
    )
    @PostMapping("/bulk")
    public List<TestCaseResponse> createTestCases(
            @PathVariable Long problemId,
            @Valid @RequestBody BulkTestCaseCreateRequest request
    ) {
        return testCaseService.createTestCases(problemId, request);
    }

    @Operation(summary = "Update test case", description = "Updates a single test case by id")
    @PutMapping("/{testCaseId}")
    public TestCaseResponse updateTestCase(
            @PathVariable Long problemId,
            @PathVariable Long testCaseId,
            @Valid @RequestBody TestCaseCreateRequest request
    ) {
        return testCaseService.updateTestCase(problemId, testCaseId, request);
    }

    @Operation(summary = "Delete test case", description = "Deletes a single test case by id")
    @DeleteMapping("/{testCaseId}")
    public ResponseEntity<Void> deleteTestCase(
            @PathVariable Long problemId,
            @PathVariable Long testCaseId
    ) {
        testCaseService.deleteTestCase(problemId, testCaseId);
        return ResponseEntity.noContent().build();
    }
}
