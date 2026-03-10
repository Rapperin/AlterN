package com.altern.submission.controller;
import com.altern.submission.dto.SubmissionResponse;
import org.springframework.web.bind.annotation.PathVariable;
import com.altern.submission.entity.Submission;
import com.altern.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.altern.submission.dto.SubmissionCreateRequest;
import java.util.List;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequiredArgsConstructor
@Tag(name = "Submissions", description = "Submission management APIs")
public class SubmissionController {
    
    private final SubmissionService submissionService;
    
    @PostMapping("/api/submissions")
    @Operation(summary = "Create a new submission", description = "Creates a submission for a coding problem")
    public SubmissionResponse createSubmission(@Valid @RequestBody SubmissionCreateRequest request) {
        return submissionService.createSubmission(request);
    }
    
    @GetMapping("/api/submissions")
    @Operation(summary = "Create a new submission", description = "Creates a submission for a coding problem")
    public List<SubmissionResponse> getSubmissions() {
        return submissionService.getSubmissions();
    }
    @GetMapping("/api/submissions/{id}")
    @Operation(summary = "Get submission by id", description = "Returns a single submission by its id")
    public SubmissionResponse getSubmissionById(@PathVariable Long id) {
        return submissionService.getSubmissionById(id);
    }
}