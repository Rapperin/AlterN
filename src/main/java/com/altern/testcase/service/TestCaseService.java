package com.altern.testcase.service;

import com.altern.common.ProblemNotFoundException;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.dto.TestCaseResponse;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.mapper.TestCaseMapper;
import com.altern.testcase.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TestCaseService {
    
    private final TestCaseRepository testCaseRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseMapper testCaseMapper;
    
    public List<TestCaseResponse> getTestCasesByProblemId(Long problemId) {
        problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException(problemId));
        
        return testCaseRepository.findByProblem_Id(problemId)
                .stream()
                .map(testCaseMapper::toResponse)
                .toList();
    }
    
    public TestCaseResponse createTestCase(Long problemId, TestCaseCreateRequest request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException(problemId));
        
        TestCase testCase = testCaseMapper.toEntity(request);
        testCase.setProblem(problem);
        
        TestCase saved = testCaseRepository.save(testCase);
        return testCaseMapper.toResponse(saved);
    }
}