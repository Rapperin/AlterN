package com.altern.problem.service;

import com.altern.common.InvalidDifficultyException;
import com.altern.common.PageResponse;
import com.altern.common.ProblemNotFoundException;
import com.altern.problem.dto.ProblemCreateRequest;
import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.mapper.ProblemMapper;
import com.altern.problem.repository.ProblemRepository;
import com.altern.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProblemService {
    
    private final ProblemRepository problemRepository;
    private final ProblemMapper problemMapper;
    private final SubmissionRepository submissionRepository;
    
    public List<ProblemResponse> getProblems() {
        return problemRepository.findAll()
                .stream()
                .map(problemMapper::toResponse)
                .sorted((a, b) -> Integer.compare(b.getSubmissionCount(), a.getSubmissionCount()))
                .toList();
    }
    
    public ProblemResponse getProblemById(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ProblemNotFoundException(id));
        
        return problemMapper.toResponse(problem);
    }
    
    public ProblemResponse createProblem(ProblemCreateRequest request) {
        Problem problem = new Problem();
        problem.setTitle(request.getTitle());
        problem.setDescription(request.getDescription());
        
        try {
            problem.setDifficulty(Difficulty.valueOf(request.getDifficulty().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new InvalidDifficultyException(request.getDifficulty());
        }
        
        Problem savedProblem = problemRepository.save(problem);
        
        return problemMapper.toResponse(savedProblem);
    }
    public PageResponse<ProblemResponse> getProblems(int page, int size) {
        
        var pageResult = problemRepository.findAll(PageRequest.of(page, size));
        
        var content = pageResult.getContent()
                .stream()
                .map(problemMapper::toResponse)
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
                .map(problemMapper::toResponse)
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
                .map(problemMapper::toResponse)
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
                .map(problemMapper::toResponse)
                .toList();
    }
    
    public long getSubmissionCount(Long problemId) {
        return submissionRepository.countByProblem_Id(problemId);
    }
}