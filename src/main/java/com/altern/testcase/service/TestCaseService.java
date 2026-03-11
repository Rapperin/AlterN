package com.altern.testcase.service;

import com.altern.common.TestCaseNotFoundException;
import com.altern.common.ProblemNotFoundException;
import com.altern.problem.entity.Problem;
import com.altern.problem.repository.ProblemRepository;
import com.altern.testcase.dto.BulkTestCaseCreateRequest;
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
        
        return testCaseRepository.findVisibleByProblemId(problemId)
                .stream()
                .map(testCaseMapper::toResponse)
                .toList();
    }

    public List<TestCaseResponse> getAllTestCasesByProblemId(Long problemId) {
        findProblem(problemId);

        return testCaseRepository.findByProblem_Id(problemId)
                .stream()
                .map(testCaseMapper::toResponse)
                .toList();
    }
    
    public TestCaseResponse createTestCase(Long problemId, TestCaseCreateRequest request) {
        Problem problem = findProblem(problemId);
        
        TestCase testCase = testCaseMapper.toEntity(request);
        testCase.setHidden(Boolean.TRUE.equals(request.getHidden()));
        testCase.setProblem(problem);
        
        TestCase saved = testCaseRepository.save(testCase);
        return testCaseMapper.toResponse(saved);
    }

    public List<TestCaseResponse> createTestCases(Long problemId, BulkTestCaseCreateRequest request) {
        Problem problem = findProblem(problemId);

        return request.getTestCases()
                .stream()
                .map(testCaseRequest -> createTestCase(problem, testCaseRequest))
                .map(testCaseMapper::toResponse)
                .toList();
    }

    public TestCaseResponse updateTestCase(Long problemId, Long testCaseId, TestCaseCreateRequest request) {
        TestCase testCase = findTestCase(problemId, testCaseId);
        testCase.setInput(request.getInput());
        testCase.setExpectedOutput(request.getExpectedOutput());
        testCase.setHidden(Boolean.TRUE.equals(request.getHidden()));

        TestCase saved = testCaseRepository.save(testCase);
        return testCaseMapper.toResponse(saved);
    }

    public void deleteTestCase(Long problemId, Long testCaseId) {
        TestCase testCase = findTestCase(problemId, testCaseId);
        testCaseRepository.delete(testCase);
    }

    private Problem findProblem(Long problemId) {
        return problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException(problemId));
    }

    private TestCase createTestCase(Problem problem, TestCaseCreateRequest request) {
        TestCase testCase = testCaseMapper.toEntity(request);
        testCase.setHidden(Boolean.TRUE.equals(request.getHidden()));
        testCase.setProblem(problem);
        return testCaseRepository.save(testCase);
    }

    private TestCase findTestCase(Long problemId, Long testCaseId) {
        findProblem(problemId);
        return testCaseRepository.findByIdAndProblem_Id(testCaseId, problemId)
                .orElseThrow(() -> new TestCaseNotFoundException(testCaseId));
    }
}
