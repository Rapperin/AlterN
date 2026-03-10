package com.altern.submission.service;
import com.altern.common.*;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.problem.service.ProblemService;
import com.altern.submission.dto.SubmissionCreateRequest;
import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.mapper.SubmissionMapper;
import com.altern.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    
    private final SubmissionRepository submissionRepository;
    private final SubmissionMapper submissionMapper;
    private final ProblemService problemService;
    private final ProblemRepository problemRepository;
    public SubmissionResponse createSubmission(SubmissionCreateRequest request) {
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new ProblemNotFoundException(request.getProblemId()));
        
        Submission submission = new Submission();
        submission.setProblem(problem);
        submission.setSourceCode(request.getSourceCode());
        submission.setCreatedAt(LocalDateTime.now());
        
        try {
            submission.setLanguage(ProgrammingLanguage.valueOf(request.getLanguage().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new InvalidProgrammingLanguageException(request.getLanguage());
        }
        
        if (submission.getSourceCode() != null &&
                submission.getSourceCode().contains("class Solution")) {
            submission.setStatus(SubmissionStatus.ACCEPTED);
        } else {
            submission.setStatus(SubmissionStatus.WRONG_ANSWER);
        }
        
        Submission savedSubmission = submissionRepository.save(submission);
        return submissionMapper.toResponse(savedSubmission);
    }
    
    public PageResponse<SubmissionResponse> getSubmissions(int page, int size) {
        
        var pageResult = submissionRepository.findAll(PageRequest.of(page, size));
        
        var content = pageResult.getContent()
                .stream()
                .map(submissionMapper::toResponse)
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .toList();
        
        return new PageResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }
    
    public SubmissionResponse getSubmissionById(Long id) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new SubmissionNotFoundException(id));
        
        return submissionMapper.toResponse(submission);
    }
    
    public List<SubmissionResponse> getSubmissionsByLanguage(String language) {
        
        ProgrammingLanguage lang;
        
        try {
            lang = ProgrammingLanguage.valueOf(language.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidProgrammingLanguageException(language);
        }
        
        return submissionRepository.findByLanguage(lang)
                .stream()
                .map(submissionMapper::toResponse)
                .toList();
    }
    public PageResponse<SubmissionResponse> getSubmissions(int page, int size, String language) {
        if (language == null || language.isBlank()) {
            return getSubmissions(page, size);
        }
        
        ProgrammingLanguage lang;
        
        try {
            lang = ProgrammingLanguage.valueOf(language.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidProgrammingLanguageException(language);
        }
        
        var allFiltered = submissionRepository.findByLanguage(lang)
                .stream()
                .map(submissionMapper::toResponse)
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
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
    
    public List<SubmissionResponse> getSubmissionsByStatus(String status) {
        
        SubmissionStatus submissionStatus;
        
        try {
            submissionStatus = SubmissionStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidSubmissionStatusException(status);
        }
        
        return submissionRepository.findByStatus(submissionStatus)
                .stream()
                .map(submissionMapper::toResponse)
                .toList();
    }
    
    public List<SubmissionResponse> getSubmissionsByProblemId(Long problemId) {
        return submissionRepository.findByProblem_Id(problemId)
                .stream()
                .map(submissionMapper::toResponse)
                .toList();
    }
    public PageResponse<SubmissionResponse> getSubmissionsByProblemId(Long problemId, int page, int size) {
        var results = submissionRepository.findByProblem_Id(problemId)
                .stream()
                .map(submissionMapper::toResponse)
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .toList();
        
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
}