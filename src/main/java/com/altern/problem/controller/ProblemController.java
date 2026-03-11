package com.altern.problem.controller;
import com.altern.common.PageResponse;
import com.altern.problem.dto.BulkProblemCreateRequest;
import com.altern.problem.dto.ProblemCreateRequest;
import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.service.ProblemService;
import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.service.SubmissionService;
import org.springframework.web.bind.annotation.RequestParam;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import io.swagger.v3.oas.annotations.Parameter;
import java.net.URI;
import java.util.List;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController
@RequiredArgsConstructor
@Tag(name = "Problems", description = "Problem management APIs")
public class ProblemController {
    
    private final ProblemService problemService;
    private final SubmissionService submissionService;
    @Operation(summary = "List all problems", description = "Returns all available coding problems")
    @GetMapping("/api/problems")
    public PageResponse<ProblemResponse> getProblems(
            @Parameter(description = "Page number, starts from 0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size, min 1 max 50")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Optional difficulty filter: EASY, MEDIUM, HARD")
            @RequestParam(required = false) String difficulty,
            
            @Parameter(description = "Optional title search")
            @RequestParam(required = false) String title
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
        
        if (title != null && !title.isBlank()) {
            var results = problemService.searchProblemsByTitle(title);
            
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
        
        return problemService.getProblems(page, size, difficulty);
    }
    @Operation(summary = "Get problem by id", description = "Returns a single problem by its id")
    @GetMapping("/api/problems/{id}")
    public ProblemResponse getProblemById(@PathVariable Long id) {
        return problemService.getProblemById(id);
    }
    @Operation(summary = "Create a new problem", description = "Creates a new coding problem")
    @PostMapping("/api/problems")
    public ResponseEntity<ProblemResponse> createProblem(@Valid @RequestBody ProblemCreateRequest request) {
        ProblemResponse created = problemService.createProblem(request);
        URI location = URI.create("/api/problems/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    @Operation(summary = "Bulk create problems", description = "Creates multiple coding problems in a single request")
    @PostMapping("/api/problems/bulk")
    public ResponseEntity<List<ProblemResponse>> createProblems(@Valid @RequestBody BulkProblemCreateRequest request) {
        return ResponseEntity.ok(problemService.createProblems(request));
    }

    @Operation(summary = "Update an existing problem", description = "Updates a coding problem by id")
    @PutMapping("/api/problems/{id}")
    public ProblemResponse updateProblem(@PathVariable Long id, @Valid @RequestBody ProblemCreateRequest request) {
        return problemService.updateProblem(id, request);
    }

    @Operation(summary = "Delete a problem", description = "Deletes a problem if it does not have submissions")
    @DeleteMapping("/api/problems/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable Long id) {
        problemService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(
            summary = "Get submissions of a problem",
            description = "Returns paginated submissions for the given problem id"
    )
    @GetMapping("/api/problems/{id}/submissions")
    public PageResponse<SubmissionResponse> getSubmissionsByProblemId(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        problemService.getProblemById(id);
        
        if (page < 0) {
            page = 0;
        }
        
        if (size < 1) {
            size = 10;
        }
        
        if (size > 50) {
            size = 50;
        }
        
        return submissionService.getPublicSubmissionsByProblemId(id, page, size);
    }
    
}
