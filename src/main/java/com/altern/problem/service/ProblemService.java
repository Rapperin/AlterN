package com.altern.problem.service;

import com.altern.auth.entity.UserRole;
import com.altern.auth.security.CurrentUserService;
import com.altern.bookmark.entity.ProblemBookmark;
import com.altern.bookmark.repository.ProblemBookmarkRepository;
import com.altern.common.InvalidDifficultyException;
import com.altern.common.PageResponse;
import com.altern.common.ProblemDeletionNotAllowedException;
import com.altern.common.ProblemNotFoundException;
import com.altern.common.InvalidProgrammingLanguageException;
import com.altern.problem.dto.BulkProblemCreateRequest;
import com.altern.problem.dto.ProblemCreateRequest;
import com.altern.problem.dto.ProblemExamplePayload;
import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.dto.ProblemStatsResponse;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.entity.ProblemExampleValue;
import com.altern.problem.mapper.ProblemMapper;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProblemService {
    
    private final ProblemRepository problemRepository;
    private final ProblemMapper problemMapper;
    private final SubmissionRepository submissionRepository;
    private final TestCaseRepository testCaseRepository;
    private final ProblemBookmarkRepository problemBookmarkRepository;
    private final CurrentUserService currentUserService;
    
    public List<ProblemResponse> getProblems() {
        return problemRepository.findAll()
                .stream()
                .map(problem -> toProblemResponse(problem, false))
                .sorted((a, b) -> Integer.compare(b.getSubmissionCount(), a.getSubmissionCount()))
                .toList();
    }
    
    public ProblemResponse getProblemById(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException(id));
        
        return toProblemResponse(problem, true);
    }

    public ProblemStatsResponse getProblemStats(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException(id));
        List<Submission> submissions = submissionRepository.findByProblem_Id(id).stream()
                .filter(this::isPublicCommunitySubmission)
                .toList();

        ProblemStatsResponse response = new ProblemStatsResponse();
        response.setProblemId(problem.getId());
        response.setProblemTitle(problem.getTitle());
        response.setTotalSubmissions(submissions.size());

        int acceptedSubmissions = (int) submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .count();
        response.setAcceptedSubmissions(acceptedSubmissions);
        response.setAcceptedUsers((int) submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(Submission::getUser)
                .filter(user -> user != null && user.getId() != null)
                .map(user -> user.getId())
                .distinct()
                .count());
        response.setAcceptanceRate(submissions.isEmpty()
                ? 0
                : (int) Math.round((acceptedSubmissions * 100.0) / submissions.size()));

        Map<ProgrammingLanguage, Integer> languageBreakdown = new EnumMap<>(ProgrammingLanguage.class);
        for (ProgrammingLanguage language : ProgrammingLanguage.values()) {
            languageBreakdown.put(language, 0);
        }

        for (Submission submission : submissions) {
            if (submission.getLanguage() == null) {
                continue;
            }
            languageBreakdown.merge(submission.getLanguage(), 1, Integer::sum);
        }

        response.setMostUsedLanguage(languageBreakdown.entrySet().stream()
                .max(Comparator.<Map.Entry<ProgrammingLanguage, Integer>>comparingInt(Map.Entry::getValue)
                        .thenComparing(entry -> entry.getKey().name()))
                .filter(entry -> entry.getValue() > 0)
                .map(entry -> entry.getKey().name())
                .orElse(null));

        Map<String, Integer> serializedBreakdown = new LinkedHashMap<>();
        for (ProgrammingLanguage language : ProgrammingLanguage.values()) {
            serializedBreakdown.put(language.name(), languageBreakdown.getOrDefault(language, 0));
        }
        response.setLanguageBreakdown(serializedBreakdown);

        response.setFastestExecutionTime(submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(Submission::getExecutionTime)
                .filter(Objects::nonNull)
                .min(Integer::compareTo)
                .orElse(null));
        response.setLowestMemoryUsage(submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(Submission::getMemoryUsage)
                .filter(Objects::nonNull)
                .min(Integer::compareTo)
                .orElse(null));
        response.setLatestAcceptedAt(submissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.ACCEPTED)
                .map(this::activityTime)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null));
        return response;
    }
    
    public ProblemResponse createProblem(ProblemCreateRequest request) {
        Problem problem = new Problem();
        applyProblemValues(problem, request);
        
        Problem savedProblem = problemRepository.save(problem);
        createImportedTestCases(savedProblem, request.getTestCases());
        
        return toProblemResponse(savedProblem, true);
    }

    public List<ProblemResponse> createProblems(BulkProblemCreateRequest request) {
        return request.getProblems()
                .stream()
                .map(this::createProblem)
                .toList();
    }

    public ProblemResponse updateProblem(Long id, ProblemCreateRequest request) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException(id));

        applyProblemValues(problem, request);

        Problem savedProblem = problemRepository.save(problem);
        return toProblemResponse(savedProblem, true);
    }

    public void deleteProblem(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException(id));

        if (submissionRepository.countByProblem_Id(id) > 0) {
            throw new ProblemDeletionNotAllowedException(id);
        }

        problemBookmarkRepository.deleteByProblem_Id(id);
        problemRepository.delete(problem);
    }

    public void bookmarkProblem(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException(id));
        var user = currentUserService.requireCurrentUser();

        if (problemBookmarkRepository.existsByUser_IdAndProblem_Id(user.getId(), problem.getId())) {
            return;
        }

        ProblemBookmark bookmark = new ProblemBookmark();
        bookmark.setProblem(problem);
        bookmark.setUser(user);
        bookmark.setCreatedAt(LocalDateTime.now());
        problemBookmarkRepository.save(bookmark);
    }

    public void removeProblemBookmark(Long id) {
        problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException(id));
        var user = currentUserService.requireCurrentUser();

        problemBookmarkRepository.findByUser_IdAndProblem_Id(user.getId(), id)
                .ifPresent(problemBookmarkRepository::delete);
    }
    public PageResponse<ProblemResponse> getProblems(int page, int size) {
        
        var pageResult = problemRepository.findAll(PageRequest.of(page, size));
        
        var content = pageResult.getContent()
                .stream()
                .map(problem -> toProblemResponse(problem, false))
                .toList();
        
        return new PageResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }
    
    public List<ProblemResponse> getProblemsByDifficulty(String difficulty) {
        
        Difficulty diff;
        
        try {
            diff = Difficulty.valueOf(difficulty.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidDifficultyException(difficulty);
        }
        
        return problemRepository.findByDifficulty(diff)
                .stream()
                .map(problem -> toProblemResponse(problem, false))
                .toList();
    }
    
    public PageResponse<ProblemResponse> getProblems(int page, int size, String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return getProblems(page, size);
        }
        
        Difficulty diff;
        
        try {
            diff = Difficulty.valueOf(difficulty.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidDifficultyException(difficulty);
        }
        
        var allFiltered = problemRepository.findByDifficulty(diff)
                .stream()
                .map(problem -> toProblemResponse(problem, false))
                .toList();
        
        int fromIndex = Math.min(page * size, allFiltered.size());
        int toIndex = Math.min(fromIndex + size, allFiltered.size());
        
        var content = allFiltered.subList(fromIndex, toIndex);
        
        int totalPages = (int) Math.ceil((double) allFiltered.size() / size);
        
        return new PageResponse<>(
                content,
                page,
                size,
                allFiltered.size(),
                totalPages
        );
    }
    
    public List<ProblemResponse> searchProblemsByTitle(String title) {
        
        return problemRepository.findByTitleContainingIgnoreCase(title)
                .stream()
                .map(problem -> toProblemResponse(problem, false))
                .toList();
    }
    
    public long getSubmissionCount(Long problemId) {
        return submissionRepository.countByProblem_Id(problemId);
    }
    
    private ProblemResponse enrichWithSubmissionCount(ProblemResponse response) {
        
        Long problemId = response.getId();
        
        response.setSubmissionCount(
                (int) submissionRepository.countByProblem_Id(problemId)
        );
        
        response.setTestCaseCount(
                (int) testCaseRepository.countVisibleByProblemId(problemId)
        );
        
        boolean solved = submissionRepository.existsByProblem_IdAndStatus(
                problemId,
                SubmissionStatus.ACCEPTED
        );
        
        if (solved) {
            response.setBestSubmissionStatus("ACCEPTED");
        } else {
            response.setBestSubmissionStatus("UNSOLVED");
        }
        
        return response;
    }

    private ProblemResponse toProblemResponse(Problem problem, boolean includeEditorialBody) {
        ProblemResponse response = enrichWithSubmissionCount(problemMapper.toResponse(problem));
        applyViewerProgress(problem, response);
        applyHintAccess(problem, response, includeEditorialBody);
        return applyEditorialAccess(problem, response, includeEditorialBody);
    }

    private void applyViewerProgress(Problem problem, ProblemResponse response) {
        response.setViewerSolved(false);
        response.setViewerBookmarked(false);
        response.setViewerStatus(null);

        if (problem == null || problem.getId() == null) {
            return;
        }

        currentUserService.findCurrentUser().ifPresent(user -> {
            response.setViewerBookmarked(problemBookmarkRepository.existsByUser_IdAndProblem_Id(user.getId(), problem.getId()));
            boolean solved = submissionRepository.existsByProblem_IdAndUser_IdAndStatus(
                    problem.getId(),
                    user.getId(),
                    SubmissionStatus.ACCEPTED
            );

            response.setViewerSolved(solved);
            if (solved) {
                response.setViewerStatus(SubmissionStatus.ACCEPTED.name());
                return;
            }

            String latestStatus = submissionRepository
                    .findFirstByUser_IdAndProblem_IdOrderByCreatedAtDescIdDesc(user.getId(), problem.getId())
                    .map(Submission::getStatus)
                    .map(Enum::name)
                    .orElse("NOT_STARTED");

            response.setViewerStatus(latestStatus);
        });
    }

    private void applyHintAccess(Problem problem, ProblemResponse response, boolean includeHintBody) {
        boolean hintAvailable = hasHint(problem);
        boolean hintUnlocked = hintAvailable && canViewHint(problem.getId());

        response.setHintAvailable(hintAvailable);
        response.setHintUnlocked(hintUnlocked);

        if (!includeHintBody || !hintUnlocked) {
            response.setHintTitle(null);
            response.setHintContent(null);
        }
    }

    private boolean hasHint(Problem problem) {
        return problem != null
                && ((problem.getHintTitle() != null && !problem.getHintTitle().isBlank())
                || (problem.getHintContent() != null && !problem.getHintContent().isBlank()));
    }

    private boolean canViewHint(Long problemId) {
        if (problemId == null) {
            return false;
        }

        if (currentUserService.isAdmin()) {
            return true;
        }

        return currentUserService.findCurrentUser()
                .map(user -> submissionRepository.existsByProblem_IdAndUser_Id(problemId, user.getId()))
                .orElse(false);
    }

    private ProblemResponse applyEditorialAccess(Problem problem, ProblemResponse response, boolean includeEditorialBody) {
        boolean editorialAvailable = hasEditorial(problem);
        boolean editorialUnlocked = editorialAvailable && canViewEditorial(problem.getId());

        response.setEditorialAvailable(editorialAvailable);
        response.setEditorialUnlocked(editorialUnlocked);

        if (!includeEditorialBody || !editorialUnlocked) {
            response.setEditorialTitle(null);
            response.setEditorialContent(null);
        }

        return response;
    }

    private boolean hasEditorial(Problem problem) {
        return problem != null
                && ((problem.getEditorialTitle() != null && !problem.getEditorialTitle().isBlank())
                || (problem.getEditorialContent() != null && !problem.getEditorialContent().isBlank()));
    }

    private boolean canViewEditorial(Long problemId) {
        if (problemId == null) {
            return false;
        }

        if (currentUserService.isAdmin()) {
            return true;
        }

        return currentUserService.findCurrentUser()
                .map(user -> submissionRepository.existsByProblem_IdAndUser_IdAndStatus(
                        problemId,
                        user.getId(),
                        SubmissionStatus.ACCEPTED
                ))
                .orElse(false);
    }

    private int resolveTimeLimitMs(Integer requestedTimeLimitMs) {
        if (requestedTimeLimitMs == null || requestedTimeLimitMs < 1) {
            return Problem.DEFAULT_TIME_LIMIT_MS;
        }

        return requestedTimeLimitMs;
    }

    private int resolveMemoryLimitMb(Integer requestedMemoryLimitMb) {
        if (requestedMemoryLimitMb == null || requestedMemoryLimitMb < 1) {
            return Problem.DEFAULT_MEMORY_LIMIT_MB;
        }

        return requestedMemoryLimitMb;
    }

    private void applyProblemValues(Problem problem, ProblemCreateRequest request) {
        problem.setTitle(request.getTitle().trim());
        problem.setDescription(request.getDescription().trim());
        problem.setConstraints(normalizeOptionalText(request.getConstraints()));
        problem.setInputFormat(normalizeOptionalText(request.getInputFormat()));
        problem.setOutputFormat(normalizeOptionalText(request.getOutputFormat()));
        problem.setHintTitle(normalizeOptionalText(request.getHintTitle()));
        problem.setHintContent(normalizeOptionalText(request.getHintContent()));
        problem.setEditorialTitle(normalizeOptionalText(request.getEditorialTitle()));
        problem.setEditorialContent(normalizeOptionalText(request.getEditorialContent()));
        problem.setTimeLimitMs(resolveTimeLimitMs(request.getTimeLimitMs()));
        problem.setMemoryLimitMb(resolveMemoryLimitMb(request.getMemoryLimitMb()));
        problem.setTags(normalizeTags(request.getTags()));
        problem.setExamples(normalizeExamples(request.getExamples()));
        applyStarterCodes(problem, request.getStarterCodes());

        try {
            problem.setDifficulty(Difficulty.valueOf(request.getDifficulty().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new InvalidDifficultyException(request.getDifficulty());
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return new ArrayList<>();
        }

        return tags.stream()
                .map(tag -> tag == null ? "" : tag.trim())
                .filter(tag -> !tag.isBlank())
                .distinct()
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    private List<ProblemExampleValue> normalizeExamples(List<ProblemExamplePayload> examples) {
        if (examples == null || examples.isEmpty()) {
            return new ArrayList<>();
        }

        return examples.stream()
                .map(this::toExampleValue)
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    private ProblemExampleValue toExampleValue(ProblemExamplePayload payload) {
        ProblemExampleValue value = new ProblemExampleValue();
        value.setInput(payload.getInput().trim());
        value.setOutput(payload.getOutput().trim());
        value.setExplanation(normalizeOptionalText(payload.getExplanation()));
        return value;
    }

    private void applyStarterCodes(Problem problem, Map<String, String> starterCodes) {
        Map<String, String> normalizedStarterCodes = normalizeStarterCodes(starterCodes);
        problem.setStarterCodeJava(normalizedStarterCodes.get("JAVA"));
        problem.setStarterCodePython(normalizedStarterCodes.get("PYTHON"));
        problem.setStarterCodeCpp(normalizedStarterCodes.get("CPP"));
    }

    private Map<String, String> normalizeStarterCodes(Map<String, String> starterCodes) {
        Map<String, String> normalized = new LinkedHashMap<>();
        if (starterCodes == null || starterCodes.isEmpty()) {
            return normalized;
        }

        for (Map.Entry<String, String> entry : starterCodes.entrySet()) {
            String key = entry.getKey() == null ? "" : entry.getKey().trim().toUpperCase();
            if (key.isBlank()) {
                continue;
            }

            try {
                ProgrammingLanguage.valueOf(key);
            } catch (IllegalArgumentException e) {
                throw new InvalidProgrammingLanguageException(entry.getKey());
            }

            String normalizedCode = normalizeOptionalText(entry.getValue());
            if (normalizedCode != null) {
                normalized.put(key, normalizedCode);
            }
        }

        return normalized;
    }

    private void createImportedTestCases(Problem problem, List<TestCaseCreateRequest> testCases) {
        if (testCases == null || testCases.isEmpty()) {
            return;
        }

        List<TestCase> entities = testCases.stream()
                .map(request -> toTestCase(problem, request))
                .toList();
        testCaseRepository.saveAll(entities);
    }

    private TestCase toTestCase(Problem problem, TestCaseCreateRequest request) {
        TestCase testCase = new TestCase();
        testCase.setProblem(problem);
        testCase.setInput(request.getInput().trim());
        testCase.setExpectedOutput(request.getExpectedOutput().trim());
        testCase.setHidden(Boolean.TRUE.equals(request.getHidden()));
        return testCase;
    }

    private boolean isPublicCommunitySubmission(Submission submission) {
        return submission != null
                && submission.getUser() != null
                && submission.getUser().getRole() == UserRole.USER;
    }

    private LocalDateTime activityTime(Submission submission) {
        return submission.getJudgedAt() != null ? submission.getJudgedAt() : submission.getCreatedAt();
    }
    
}
