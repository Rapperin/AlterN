package com.altern.submission.judge;

import com.altern.testcase.entity.TestCase;
import org.springframework.stereotype.Service;
import com.altern.submission.judge.JudgeResult;

import java.util.List;

@Service
public class JudgeService {
    
    public JudgeResult judge(List<TestCase> testCases, String sourceCode) {
        
        if (!hasTestCases(testCases)) {
            return new JudgeResult(false, 0, 0);
        }
        
        if (!hasSourceCode(sourceCode)) {
            return new JudgeResult(false, 0, testCases.size());
        }
        
        int passed = 0;
        int total = testCases.size();
        
        for (TestCase testCase : testCases) {
            if (passesMockExecution(testCase, sourceCode)) {
                passed++;
            } else {
                return new JudgeResult(false, passed, total);
            }
        }
        
        return new JudgeResult(true, passed, total);
    }
    
    private boolean hasTestCases(List<TestCase> testCases) {
        return testCases != null && !testCases.isEmpty();
    }
    
    private boolean hasSourceCode(String sourceCode) {
        return sourceCode != null && !sourceCode.isBlank();
    }
    
    private boolean passesMockExecution(TestCase testCase, String sourceCode) {
        String actualOutput = executeMock(sourceCode, testCase.getInput());
        return matchesExpectedOutput(actualOutput, testCase.getExpectedOutput());
    }
    
    private String executeMock(String sourceCode, String input) {
        if (!sourceCode.contains("class Solution")) {
            return "WRONG";
        }
        
        if ("10".equals(input)) {
            return "23";
        }
        
        if ("1000".equals(input)) {
            return "233168";
        }
        
        return "UNKNOWN";
    }
    
    private boolean matchesExpectedOutput(String actualOutput, String expectedOutput) {
        if (actualOutput == null || expectedOutput == null) {
            return false;
        }
        
        return actualOutput.trim().equals(expectedOutput.trim());
    }
}