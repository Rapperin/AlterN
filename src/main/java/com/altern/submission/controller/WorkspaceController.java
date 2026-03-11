package com.altern.submission.controller;

import com.altern.submission.dto.ProblemWorkspaceResponse;
import com.altern.submission.dto.WorkspaceCompareRequest;
import com.altern.submission.dto.WorkspaceCompareResponse;
import com.altern.submission.dto.WorkspaceReplayRequest;
import com.altern.submission.dto.WorkspaceReplayResponse;
import com.altern.submission.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class WorkspaceController {

    private final SubmissionService submissionService;

    @GetMapping("/api/workspace/problems/{problemId}")
    public ProblemWorkspaceResponse getProblemWorkspace(@PathVariable Long problemId) {
        return submissionService.getProblemWorkspace(problemId);
    }

    @PostMapping("/api/workspace/problems/{problemId}/replay")
    public WorkspaceReplayResponse replayProblem(
            @PathVariable Long problemId,
            @Valid @RequestBody WorkspaceReplayRequest request
    ) {
        return submissionService.replayProblem(problemId, request);
    }

    @PostMapping("/api/workspace/problems/{problemId}/compare")
    public WorkspaceCompareResponse compareProblemReplay(
            @PathVariable Long problemId,
            @Valid @RequestBody WorkspaceCompareRequest request
    ) {
        return submissionService.compareProblemReplay(problemId, request);
    }
}
