package com.altern.submission.service;
import com.altern.auth.entity.UserAccount;
import com.altern.auth.security.CurrentUserService;
import com.altern.common.*;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.dto.ProblemWorkspaceResponse;
import com.altern.submission.dto.SubmissionCreateRequest;
import com.altern.submission.dto.SubmissionDetailResponse;
import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.dto.WorkspaceCompareRequest;
import com.altern.submission.dto.WorkspaceCompareResponse;
import com.altern.submission.dto.WorkspaceCompareRunResponse;
import com.altern.submission.dto.WorkspaceReplayRequest;
import com.altern.submission.dto.WorkspaceReplayResponse;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.mapper.SubmissionMapper;
import com.altern.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.altern.submission.judge.JudgeService;
import com.altern.submission.judge.JudgeResult;
import com.altern.submission.runner.CodeRunner;
import com.altern.submission.runner.ExecutionRequest;
import com.altern.submission.runner.ExecutionResult;
import com.altern.submission.runner.ExecutionStatus;
import com.altern.testcase.repository.TestCaseRepository;
import java.time.LocalDateTime;
import org.springframework.data.domain.PageRequest;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    
    private final JudgeService judgeService;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionMapper submissionMapper;
    private final ProblemRepository problemRepository;
    private final CurrentUserService currentUserService;
    private final CodeRunner codeRunner;

    public SubmissionResponse createSubmission(SubmissionCreateRequest request) {
        Problem problem = findProblem(request.getProblemId());
        UserAccount currentUser = currentUserService.requireCurrentUser();
        Submission submission = buildSubmission(request, problem, currentUser);
        submission = submissionRepository.save(submission);

        JudgeResult judgeResult = runJudge(submission);
        applyJudgeResult(submission, judgeResult);

        Submission savedSubmission = submissionRepository.save(submission);
        return submissionMapper.toResponse(savedSubmission);
    }
    
    public PageResponse<SubmissionResponse> getSubmissions(int page, int size) {
        return paginateSubmissions(findVisibleSubmissions(), page, size);
    }
    
    public SubmissionDetailResponse getSubmissionById(Long id) {
        return submissionMapper.toDetailResponse(findAccessibleSubmission(id));
    }
    
    public List<SubmissionResponse> getSubmissionsByLanguage(String language) {
        ProgrammingLanguage lang;

        try {
            lang = ProgrammingLanguage.valueOf(language.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidProgrammingLanguageException(language);
        }

        List<Submission> submissions;

        if (currentUserService.isAdmin()) {
            submissions = submissionRepository.findByLanguage(lang);
        } else {
            submissions = submissionRepository.findByUser_IdAndLanguage(currentUserService.requireCurrentUser().getId(), lang);
        }

        return mapAndSort(submissions);
    }
    public PageResponse<SubmissionResponse> getSubmissions(int page, int size, String language) {
        if (language == null || language.isBlank()) {
            return getSubmissions(page, size);
        }

        return paginateResponses(getSubmissionsByLanguage(language), page, size);
    }
    
    public List<SubmissionResponse> getSubmissionsByStatus(String status) {
        SubmissionStatus submissionStatus;

        try {
            submissionStatus = SubmissionStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidSubmissionStatusException(status);
        }

        List<Submission> submissions;

        if (currentUserService.isAdmin()) {
            submissions = submissionRepository.findByStatus(submissionStatus);
        } else {
            submissions = submissionRepository.findByUser_IdAndStatus(
                    currentUserService.requireCurrentUser().getId(),
                    submissionStatus
            );
        }

        return mapAndSort(submissions);
    }
    
    public List<SubmissionResponse> getSubmissionsByProblemId(Long problemId) {
        List<Submission> submissions;

        if (currentUserService.isAdmin()) {
            submissions = submissionRepository.findByProblem_Id(problemId);
        } else {
            submissions = submissionRepository.findByUser_IdAndProblem_Id(
                    currentUserService.requireCurrentUser().getId(),
                    problemId
            );
        }

        return mapAndSort(submissions);
    }
    public PageResponse<SubmissionResponse> getSubmissionsByProblemId(Long problemId, int page, int size) {
        return paginateResponses(getSubmissionsByProblemId(problemId), page, size);
    }

    public PageResponse<SubmissionResponse> getPublicSubmissionsByProblemId(Long problemId, int page, int size) {
        List<SubmissionResponse> responses = mapAndSort(submissionRepository.findByProblem_Id(problemId));
        return paginateResponses(responses, page, size);
    }

    public ProblemWorkspaceResponse getProblemWorkspace(Long problemId) {
        Problem problem = findProblem(problemId);
        UserAccount currentUser = currentUserService.requireCurrentUser();
        List<Submission> submissions = sortSubmissions(
                submissionRepository.findByUser_IdAndProblem_Id(currentUser.getId(), problem.getId())
        );

        ProblemWorkspaceResponse response = new ProblemWorkspaceResponse();
        response.setProblemId(problem.getId());
        response.setAttemptCount(submissions.size());
        response.setAcceptedCount((int) submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .count());
        response.setSolved(response.getAcceptedCount() > 0);
        response.setFailureBreakdown(buildFailureBreakdown(submissions));

        Submission lastSubmission = submissions.isEmpty() ? null : submissions.get(0);
        response.setLastSubmissionId(lastSubmission == null ? null : lastSubmission.getId());
        response.setLastStatus(lastSubmission == null || lastSubmission.getStatus() == null
                ? "NOT_STARTED"
                : lastSubmission.getStatus().name());
        response.setLastSubmissionLanguage(lastSubmission == null || lastSubmission.getLanguage() == null
                ? null
                : lastSubmission.getLanguage().name());
        response.setLastSubmittedAt(lastSubmission == null ? null : lastSubmission.getCreatedAt());
        response.setLastVerdictMessage(lastSubmission == null ? null : lastSubmission.getVerdictMessage());
        response.setLastFailedTestIndex(lastSubmission == null ? null : lastSubmission.getFailedTestIndex());
        response.setLastFailedVisible(lastSubmission == null ? null : lastSubmission.getFailedVisibleCase());
        response.setLastFailedInputPreview(lastSubmission == null ? null : lastSubmission.getFailedInputPreview());
        response.setLastFailedExpectedOutputPreview(lastSubmission == null ? null : lastSubmission.getFailedExpectedOutputPreview());
        response.setLastFailedActualOutputPreview(lastSubmission == null ? null : lastSubmission.getFailedActualOutputPreview());

        Submission lastAccepted = submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .findFirst()
                .orElse(null);

        if (lastAccepted != null) {
            response.setLastAcceptedSubmissionId(lastAccepted.getId());
            response.setLastAcceptedAt(lastAccepted.getJudgedAt());
            response.setLastAcceptedLanguage(lastAccepted.getLanguage() == null ? null : lastAccepted.getLanguage().name());
            response.setLastAcceptedExecutionTime(lastAccepted.getExecutionTime());
            response.setLastAcceptedMemoryUsage(lastAccepted.getMemoryUsage());
        }

        return response;
    }

    public WorkspaceReplayResponse replayProblem(Long problemId, WorkspaceReplayRequest request) {
        Problem problem = findProblem(problemId);
        currentUserService.requireCurrentUser();

        String input = request.getInput() == null ? "" : request.getInput();
        String expectedOutput = emptyToNull(request.getExpectedOutput());
        ExecutionResult result = executeWorkspaceRun(
                parseLanguage(request.getLanguage()),
                request.getSourceCode(),
                input,
                resolveTimeLimitMs(problem)
        );

        return buildReplayResponse(problem.getId(), expectedOutput, result);
    }

    public WorkspaceCompareResponse compareProblemReplay(Long problemId, WorkspaceCompareRequest request) {
        Problem problem = findProblem(problemId);
        currentUserService.requireCurrentUser();

        Submission baselineSubmission = findAccessibleSubmission(request.getBaselineSubmissionId());
        if (!baselineSubmission.getProblem().getId().equals(problem.getId())) {
            throw new WorkspaceComparisonNotAllowedException("Selected submission does not belong to this problem.");
        }

        String input = request.getInput() == null ? "" : request.getInput();
        String expectedOutput = emptyToNull(request.getExpectedOutput());
        int timeLimitMs = resolveTimeLimitMs(problem);

        WorkspaceCompareRunResponse currentRun = buildCompareRunResponse(
                null,
                parseLanguage(request.getLanguage()),
                expectedOutput,
                executeWorkspaceRun(
                        parseLanguage(request.getLanguage()),
                        request.getSourceCode(),
                        input,
                        timeLimitMs
                )
        );

        WorkspaceCompareRunResponse baselineRun = buildCompareRunResponse(
                baselineSubmission.getId(),
                baselineSubmission.getLanguage(),
                expectedOutput,
                executeWorkspaceRun(
                        baselineSubmission.getLanguage(),
                        baselineSubmission.getSourceCode(),
                        input,
                        timeLimitMs
                )
        );

        WorkspaceCompareResponse response = new WorkspaceCompareResponse();
        response.setProblemId(problem.getId());
        response.setInput(input);
        response.setExpectedOutput(expectedOutput);
        response.setCurrentRun(currentRun);
        response.setBaselineRun(baselineRun);

        if (currentRun.getOutput() != null && baselineRun.getOutput() != null) {
            response.setSameOutput(outputsMatch(currentRun.getOutput(), baselineRun.getOutput()));
        }

        return response;
    }

    private Problem findProblem(Long problemId) {
        return problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException(problemId));
    }

    private Submission buildSubmission(SubmissionCreateRequest request, Problem problem, UserAccount currentUser) {
        Submission submission = new Submission();
        submission.setProblem(problem);
        submission.setUser(currentUser);
        submission.setLanguage(parseLanguage(request.getLanguage()));
        submission.setSourceCode(request.getSourceCode());
        submission.setCreatedAt(LocalDateTime.now());
        submission.setStatus(SubmissionStatus.PENDING);
        return submission;
    }

    private ProgrammingLanguage parseLanguage(String language) {
        try {
            return ProgrammingLanguage.valueOf(language.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidProgrammingLanguageException(language);
        }
    }

    private JudgeResult runJudge(Submission submission) {
        var testCases = testCaseRepository.findByProblem_Id(submission.getProblem().getId());
        return judgeService.judge(
                testCases,
                submission.getLanguage(),
                submission.getSourceCode(),
                resolveTimeLimitMs(submission.getProblem())
        );
    }

    private void applyJudgeResult(Submission submission, JudgeResult judgeResult) {
        submission.setPassedTestCount(judgeResult.getPassedTestCount());
        submission.setTotalTestCount(judgeResult.getTotalTestCount());
        submission.setExecutionTime(judgeResult.getExecutionTime());
        submission.setMemoryUsage(judgeResult.getMemoryUsage());
        submission.setVerdictMessage(judgeResult.getVerdictMessage());
        submission.setFailedTestIndex(judgeResult.getFailedTestIndex());
        submission.setFailedVisibleCase(judgeResult.getFailedVisible());
        submission.setFailedInputPreview(judgeResult.getFailedInputPreview());
        submission.setFailedExpectedOutputPreview(judgeResult.getFailedExpectedOutputPreview());
        submission.setFailedActualOutputPreview(judgeResult.getFailedActualOutputPreview());
        submission.setStatus(judgeResult.getStatus());
        submission.setJudgedAt(LocalDateTime.now());
    }

    private Submission findAccessibleSubmission(Long id) {
        if (currentUserService.isAdmin()) {
            return submissionRepository.findById(id)
                    .orElseThrow(() -> new SubmissionNotFoundException(id));
        }

        return submissionRepository.findByIdAndUser_Id(id, currentUserService.requireCurrentUser().getId())
                .orElseThrow(() -> new SubmissionNotFoundException(id));
    }

    private int resolveTimeLimitMs(Problem problem) {
        return problem == null ? Problem.DEFAULT_TIME_LIMIT_MS : problem.resolveTimeLimitMs();
    }

    private ExecutionResult executeWorkspaceRun(
            ProgrammingLanguage language,
            String sourceCode,
            String input,
            int timeLimitMs
    ) {
        return codeRunner.run(
                new ExecutionRequest(
                        language,
                        sourceCode,
                        input,
                        timeLimitMs
                )
        );
    }

    private WorkspaceReplayResponse buildReplayResponse(Long problemId, String expectedOutput, ExecutionResult result) {
        WorkspaceReplayResponse response = new WorkspaceReplayResponse();
        response.setProblemId(problemId);
        response.setStatus(result.getStatus().name());
        response.setOutput(result.getOutput());
        response.setExpectedOutput(expectedOutput);
        response.setExecutionTime(metricOrZero(result.getExecutionTime()));
        response.setMemoryUsage(metricOrZero(result.getMemoryUsage()));
        response.setMessage(result.getMessage());

        if (result.getStatus() == ExecutionStatus.SUCCESS && expectedOutput != null) {
            response.setMatchedExpected(outputsMatch(result.getOutput(), expectedOutput));
        }

        return response;
    }

    private WorkspaceCompareRunResponse buildCompareRunResponse(
            Long submissionId,
            ProgrammingLanguage language,
            String expectedOutput,
            ExecutionResult result
    ) {
        WorkspaceCompareRunResponse response = new WorkspaceCompareRunResponse();
        response.setSubmissionId(submissionId);
        response.setLanguage(language == null ? null : language.name());
        response.setStatus(result.getStatus().name());
        response.setOutput(result.getOutput());
        response.setExecutionTime(metricOrZero(result.getExecutionTime()));
        response.setMemoryUsage(metricOrZero(result.getMemoryUsage()));
        response.setMessage(result.getMessage());

        if (result.getStatus() == ExecutionStatus.SUCCESS && expectedOutput != null) {
            response.setMatchedExpected(outputsMatch(result.getOutput(), expectedOutput));
        }

        return response;
    }

    private boolean outputsMatch(String actualOutput, String expectedOutput) {
        if (actualOutput == null || expectedOutput == null) {
            return false;
        }

        return actualOutput.trim().equals(expectedOutput.trim());
    }

    private List<Submission> findVisibleSubmissions() {
        if (currentUserService.isAdmin()) {
            return submissionRepository.findAll();
        }

        return submissionRepository.findByUser_Id(currentUserService.requireCurrentUser().getId());
    }

    private List<SubmissionResponse> mapAndSort(List<Submission> submissions) {
        return sortSubmissions(submissions).stream()
                .map(submissionMapper::toResponse)
                .toList();
    }

    private List<Submission> sortSubmissions(List<Submission> submissions) {
        return submissions.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) {
                        return Long.compare(b.getId() == null ? Long.MIN_VALUE : b.getId(), a.getId() == null ? Long.MIN_VALUE : a.getId());
                    }
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;

                    int compare = b.getCreatedAt().compareTo(a.getCreatedAt());
                    if (compare != 0) {
                        return compare;
                    }

                    return Long.compare(b.getId() == null ? Long.MIN_VALUE : b.getId(), a.getId() == null ? Long.MIN_VALUE : a.getId());
                })
                .toList();
    }

    private Map<String, Integer> buildFailureBreakdown(List<Submission> submissions) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        for (Submission submission : submissions) {
            if (submission.getStatus() == null
                    || submission.getStatus() == SubmissionStatus.ACCEPTED
                    || submission.getStatus() == SubmissionStatus.PENDING) {
                continue;
            }

            breakdown.merge(submission.getStatus().name(), 1, Integer::sum);
        }
        return breakdown;
    }

    private int metricOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private PageResponse<SubmissionResponse> paginateSubmissions(List<Submission> submissions, int page, int size) {
        return paginateResponses(mapAndSort(submissions), page, size);
    }

    private PageResponse<SubmissionResponse> paginateResponses(List<SubmissionResponse> responses, int page, int size) {
        int fromIndex = Math.min(page * size, responses.size());
        int toIndex = Math.min(fromIndex + size, responses.size());
        List<SubmissionResponse> content = responses.subList(fromIndex, toIndex);
        int totalPages = (int) Math.ceil((double) responses.size() / size);

        return new PageResponse<>(
                content,
                page,
                size,
                responses.size(),
                totalPages
        );
    }
}
