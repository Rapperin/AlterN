package com.altern.submission.controller;
import com.altern.common.PageResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import io.swagger.v3.oas.annotations.Parameter;

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
    
    @Operation(summary = "Create a new submission", description = "Creates a submission for a coding problem")
    @GetMapping("/api/submissions")
    public PageResponse<SubmissionResponse> getSubmissions(
            @Parameter(description = "Page number, starts from 0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size, min 1 max 50")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Optional language filter: JAVA, PYTHON, CPP")
            @RequestParam(required = false) String language,
            
            @Parameter(description = "Optional status filter: ACCEPTED, WRONG_ANSWER, RUNTIME_ERROR, PENDING")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Optional problem id filter")
            @RequestParam(required = false) Long problemId
    ) {
        if (page < 0) {
            page = 0;
        }
        
        if (size < 1) {
            size = 10;
        }
        
        if (size > 50) {
            size = 50;
        }
        
        if (problemId != null) {
            var results = submissionService.getSubmissionsByProblemId(problemId);
            
            int fromIndex = Math.min(page * size, results.size());
            int toIndex = Math.min(fromIndex + size, results.size());
            
            var content = results.subList(fromIndex, toIndex);
            int totalPages = (int) Math.ceil((double) results.size() / size);
            
            return new PageResponse<>(
                    content,
                    page,
                    size,
                    results.size(),
                    totalPages
            );
        }
        
        if (status != null && !status.isBlank()) {
            var results = submissionService.getSubmissionsByStatus(status);
            
            int fromIndex = Math.min(page * size, results.size());
            int toIndex = Math.min(fromIndex + size, results.size());
            
            var content = results.subList(fromIndex, toIndex);
            int totalPages = (int) Math.ceil((double) results.size() / size);
            
            return new PageResponse<>(
                    content,
                    page,
                    size,
                    results.size(),
                    totalPages
            );
        }
        
        return submissionService.getSubmissions(page, size, language);
    }
    @GetMapping("/api/submissions/{id}")
    @Operation(summary = "Get submission by id", description = "Returns a single submission by its id")
    public SubmissionResponse getSubmissionById(@PathVariable Long id) {
        return submissionService.getSubmissionById(id);
    }
}