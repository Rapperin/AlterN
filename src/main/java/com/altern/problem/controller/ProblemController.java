package com.altern.problem.controller;
import com.altern.problem.dto.ProblemCreateRequest;
import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.entity.Problem;
import com.altern.problem.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
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
    
    @Operation(summary = "List all problems", description = "Returns all available coding problems")
    @GetMapping("/api/problems")
    public List<ProblemResponse> getProblems() {
        return problemService.getProblems();
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
}