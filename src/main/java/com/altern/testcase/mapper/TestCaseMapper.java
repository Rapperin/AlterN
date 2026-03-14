package com.altern.testcase.mapper;

import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.dto.TestCaseResponse;
import com.altern.testcase.entity.TestCase;
import org.springframework.stereotype.Component;

@Component
public class TestCaseMapper {

    public TestCaseResponse toResponse(TestCase testCase) {
        if (testCase == null) {
            return null;
        }

        TestCaseResponse response = new TestCaseResponse();
        response.setId(testCase.getId());
        response.setInput(testCase.getInput());
        response.setExpectedOutput(testCase.getExpectedOutput());
        response.setHidden(Boolean.TRUE.equals(testCase.getHidden()));
        return response;
    }

    public TestCase toEntity(TestCaseCreateRequest request) {
        if (request == null) {
            return null;
        }

        TestCase testCase = new TestCase();
        testCase.setInput(request.getInput());
        testCase.setExpectedOutput(request.getExpectedOutput());
        testCase.setHidden(Boolean.TRUE.equals(request.getHidden()));
        return testCase;
    }
}
